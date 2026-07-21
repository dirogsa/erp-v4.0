from typing import List, Dict, Any
from app.models.inventory import Product

class DIMSEngine:
    """
    Dimensional Intelligent Matching System (DIMS) - 2.0 Enterprise Edition
    Features: Quadratic Penalties, Shape Deduction, MongoDB Pre-indexing, Multi-Scoring.
    """
    
    RULES = {
        "FILTRO DE AIRE": {
            "A": {"plus": 2.0, "minus": 5.0, "weight": 35}, 
            "B": {"plus": 2.0, "minus": 5.0, "weight": 35}, 
            "C": {"plus": 2.0, "minus": 5.0, "weight": 10}, 
            "D": {"plus": 2.0, "minus": 5.0, "weight": 10}, 
            "H": {"plus": 2.0, "minus": 8.0, "weight": 10}
        },
        "FILTRO DE ACEITE": {
            "A": {"plus": 2.0, "minus": 5.0, "weight": 60}, 
            "B": {"plus": 1.5, "minus": 1.5, "weight": 30}, 
            "C": {"plus": 1.5, "minus": 1.5, "weight": 30}, 
            "H": {"plus": 25.0, "minus": 25.0, "weight": 10}
        },
        "FILTRO DE CABINA": {
            "A": {"plus": 1.0, "minus": 5.0, "weight": 40}, 
            "B": {"plus": 1.0, "minus": 5.0, "weight": 40}, 
            "H": {"plus": 1.0, "minus": 3.0, "weight": 20}
        },
        "FILTRO DE COMBUSTIBLE": {
            "A": {"plus": 1.0, "minus": 3.0, "weight": 50}, # OD
            "H":  {"plus": 5.0, "minus": 10.0, "weight": 20},
            "IN": {"plus": 0.0, "minus": 0.0, "weight": 15}, 
            "OUT":{"plus": 0.0, "minus": 0.0, "weight": 15}
        }
    }

    @staticmethod
    def deduce_shape(specs_num: dict) -> str:
        """Deducción Matemática de Forma."""
        has_A = "A" in specs_num
        has_B = "B" in specs_num
        has_C = "C" in specs_num
        
        if has_A and not has_B:
            return "CYLINDRICAL"
        if has_A and has_B and not has_C:
            return "PANEL"
        if has_A and has_B and has_C:
            return "CONICAL_OR_RING"
        return "UNKNOWN"

    @classmethod
    async def find_alternatives(cls, sku: str, flexibility: str = "high") -> Dict[str, Any]:
        flex_multiplier = 1.0
        if flexibility == "medium":
            flex_multiplier = 2.5
        elif flexibility == "low":
            flex_multiplier = 4.0

        source_product = await Product.find_one({"sku": sku})
        if not source_product:
            raise ValueError(f"Product {sku} not found")

        cat_name = source_product.category_name
        if not cat_name:
            return {"status": "error", "message": "Product has no category to compare."}

        direct_equivalences = [
            {"brand": e.brand, "code": e.code, "is_original": e.is_original} 
            for e in source_product.equivalences
        ]

        source_specs_num = {}
        source_specs_str = {}
        
        for s in source_product.specs:
            try:
                clean_val = str(s.value).replace(',', '.')
                source_specs_num[s.label] = float(clean_val)
            except ValueError:
                source_specs_str[s.label] = str(s.value).strip().upper()

        source_shape = cls.deduce_shape(source_specs_num)

        matches = []
        if source_specs_num or source_specs_str:
            cat_rules = cls.RULES.get(cat_name.upper(), {})

            # --- FASE 4: PRE-INDEXACIÓN EN MONGODB ---
            query = {
                "category_name": cat_name, 
                "sku": {"$ne": sku},
                "status": "AVAILABLE"
            }
            
            critical_keywords = ['G', 'THREAD', 'ROSCA', 'VALVULA', 'VALVE', 'BYPASS']
            and_conditions = []
            
            for label, val in source_specs_str.items():
                if any(k in label.upper() for k in critical_keywords):
                    and_conditions.append({
                        "specs": {
                            "$elemMatch": {
                                "label": label,
                                "value": val
                            }
                        }
                    })
                    
            if and_conditions:
                query["$and"] = and_conditions

            candidates = await Product.find(query).to_list()
            
            for cand in candidates:
                cand_specs_num = {}
                cand_specs_str = {}
                
                for s in cand.specs:
                    try:
                        cand_specs_num[s.label] = float(str(s.value).replace(',', '.'))
                    except ValueError:
                        cand_specs_str[s.label] = str(s.value).strip().upper()
                
                # Deducción de forma del candidato
                cand_shape = cls.deduce_shape(cand_specs_num)
                if cand_shape != "UNKNOWN" and source_shape != "UNKNOWN" and cand_shape != source_shape:
                    continue # Descarta formas incompatibles (Hard Filter)
                
                is_match = True
                warnings = []
                
                # --- A. VALIDACIÓN ESTRICTA (Hard Filters) ---
                for label, src_str_val in source_specs_str.items():
                    is_critical = any(k in label.upper() for k in critical_keywords)
                    if is_critical:
                        if label not in cand_specs_str or cand_specs_str[label] != src_str_val:
                            is_match = False
                            break
                        
                if not is_match:
                    continue 
                    
                # --- B. PENALIZACIÓN CUADRÁTICA Y BONUS ---
                score_penalty = 0.0
                total_weight = 0.0
                bonus_points = 0.0
                evaluated_params = 0
                
                for label, src_num_val in source_specs_num.items():
                    if label not in cand_specs_num:
                        warnings.append(f"Falta medida {label}")
                        continue
                        
                    evaluated_params += 1
                    cand_num_val = cand_specs_num[label]
                    rule = cat_rules.get(label)
                    
                    if not rule:
                        if src_num_val != cand_num_val:
                            is_match = False
                            break
                        continue

                    total_weight += rule["weight"]
                    diff = cand_num_val - src_num_val
                    
                    allowed_plus = rule["plus"] * flex_multiplier
                    allowed_minus = rule["minus"] * flex_multiplier
                    
                    # Exact Match Bonus
                    if abs(diff) < 0.1:
                        bonus_points += 2.0
                        continue
                    
                    if diff > 0:
                        if diff > allowed_plus:
                            is_match = False
                            break
                        base_plus = rule["plus"] if rule["plus"] > 0 else 0.1
                        # Penalidad Cuadrática
                        penalty = ((diff / base_plus) ** 2) * rule["weight"]
                        score_penalty += penalty
                        warnings.append(f"{label} +{round(diff, 1)}mm")
                    elif diff < 0:
                        abs_diff = abs(diff)
                        if abs_diff > allowed_minus:
                            is_match = False
                            break
                        base_minus = rule["minus"] if rule["minus"] > 0 else 0.1
                        penalty = ((abs_diff / base_minus) ** 2) * rule["weight"]
                        score_penalty += penalty
                        warnings.append(f"{label} -{round(abs_diff, 1)}mm")
                        
                if is_match:
                    # Cálculo de Confianza
                    confidence = 100.0 if len(source_specs_num) == 0 else (evaluated_params / len(source_specs_num)) * 100.0
                    
                    # Cálculo de Similitud
                    final_score = 100.0
                    if total_weight > 0:
                        # La escala base es 100
                        normalized_penalty = (score_penalty / total_weight) * 100.0
                        final_score = (100.0 - normalized_penalty) + bonus_points
                    
                    final_score = min(100.0, max(0.0, final_score))
                    
                    # Nivel de Recomendación Comercial
                    if final_score >= 99:
                        match_level = "Equivalencia prácticamente idéntica"
                    elif final_score >= 97:
                        match_level = "Equivalencia muy alta"
                    elif final_score >= 94:
                        match_level = "Compatible con revisión recomendada"
                    elif final_score >= 90:
                        match_level = "Posible reemplazo; revisar especificaciones"
                    else:
                        match_level = "No recomendado, evalúe tolerancias"
                    
                    matches.append({
                        "sku": cand.sku,
                        "brand": cand.brand,
                        "name": cand.name,
                        "imageUrl": cand.image_url,
                        "similarity_score": round(final_score, 1),
                        "confidence_score": round(confidence, 1),
                        "compatibility_score": 100.0, # Pasó Hard Filters
                        "match_level": match_level,
                        "warnings": warnings,
                        "specs": [
                            {"label": s.label, "display_label": getattr(s, "display_label", s.label), "value": s.value} 
                            for s in cand.specs
                        ]
                    })

            matches.sort(key=lambda x: x["similarity_score"], reverse=True)

        return {
            "status": "success",
            "source_sku": sku,
            "category": cat_name,
            "official_equivalences": direct_equivalences,
            "dimensional_similarities": matches
        }
