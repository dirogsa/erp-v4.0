from typing import List, Dict, Any, Tuple
from app.models.inventory import Product

class DIMSEngine:
    """
    Dimensional Intelligent Matching System (DIMS) - 3.0 Enterprise Edition
    Architecture: 5-Stage Pipeline (Eligibility -> Comparability -> Similarity -> Confidence -> Ranking)
    Principle: Absence of data must never increase the probability of equivalence.
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
            "A": {"plus": 1.0, "minus": 3.0, "weight": 50}, 
            "H": {"plus": 5.0, "minus": 10.0, "weight": 20},
            "IN": {"plus": 0.0, "minus": 0.0, "weight": 15}, 
            "OUT":{"plus": 0.0, "minus": 0.0, "weight": 15}
        }
    }

    CRITICAL_KEYWORDS = ['G', 'THREAD', 'ROSCA', 'VALVULA', 'VALVE', 'BYPASS']

    @staticmethod
    def _normalize_label(label: str) -> str:
        """Adapter Pattern: Standardizes local labels to Universal Engineering Codes."""
        l = label.strip().upper()
        mapping = {
            "ALTURA": "H",
            "DIÁMETRO EXTERNO": "A",
            "DIAMETRO EXTERNO": "A",
            "DIÁMETRO INTERNO": "B",
            "DIAMETRO INTERNO": "B",
            "DIÁMETRO INTERNO 2": "C",
            "DIAMETRO INTERNO 2": "C",
            "ROSCA": "G",
            "THREAD": "G",
            "ENTRADA": "IN",
            "SALIDA": "OUT"
        }
        return mapping.get(l, l)

    @staticmethod
    def deduce_shape(specs_num: dict) -> str:
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
    def _check_eligibility(cls, source_shape: str, cand_shape: str, source_str: dict, cand_str: dict) -> Tuple[bool, List[str]]:
        """Stage 1: Eligibility. Can this filter even compete?"""
        evidence = []
        if cand_shape != "UNKNOWN" and source_shape != "UNKNOWN" and cand_shape != source_shape:
            return False, []
            
        for label, src_str_val in source_str.items():
            is_critical = any(k in label.upper() for k in cls.CRITICAL_KEYWORDS)
            if is_critical:
                if label not in cand_str or cand_str[label] != src_str_val:
                    return False, []
                evidence.append(f"{label} idéntica")
        return True, evidence

    @classmethod
    def _compute_comparability(cls, source_num: dict, cand_num: dict, cat_rules: dict) -> float:
        """Stage 2: Comparability Index (Available Weight / Total Source Weight)"""
        total_source_weight = 0.0
        available_weight = 0.0
        
        for label, src_val in source_num.items():
            rule = cat_rules.get(label)
            if rule:
                total_source_weight += rule["weight"]
                if label in cand_num:
                    available_weight += rule["weight"]
                    
        if total_source_weight == 0:
            return 0.0 # Strict Rule: Absence of data means 0% comparability.
            
        return (available_weight / total_source_weight) * 100.0

    @classmethod
    def _compute_similarity(cls, source_num: dict, cand_num: dict, cat_rules: dict, flex_multiplier: float) -> Tuple[float, List[str], List[str]]:
        """Stage 3: Similarity (Quadratic penalty, saturated, penalize missing)"""
        score_penalty = 0.0
        total_weight = 0.0
        matches = []
        warnings = []
        
        for label, src_num_val in source_num.items():
            rule = cat_rules.get(label)
            if not rule:
                continue
                
            total_weight += rule["weight"]
            
            if label not in cand_num:
                # Rule 3: Missing dimensions are penalized with 100% of their weight
                score_penalty += rule["weight"]
                warnings.append(f"Medida {label} no registrada")
                continue
                
            cand_num_val = cand_num[label]
            diff = cand_num_val - src_num_val
            
            allowed_plus = rule["plus"] * flex_multiplier
            allowed_minus = rule["minus"] * flex_multiplier
            
            if abs(diff) < 0.1:
                matches.append(f"{label} idéntico")
                continue
                
            if diff > 0:
                if diff > allowed_plus:
                    score_penalty += rule["weight"]
                    warnings.append(f"{label} excede tolerancia máxima (+{round(diff, 1)}mm)")
                else:
                    base_plus = rule["plus"] if rule["plus"] > 0 else 0.1
                    penalty = min(((diff / base_plus) ** 2) * rule["weight"], rule["weight"])
                    score_penalty += penalty
                    if penalty < rule["weight"] * 0.1:
                        matches.append(f"{label} 99% similar")
                    else:
                        warnings.append(f"{label} +{round(diff, 1)}mm")
                        
            elif diff < 0:
                abs_diff = abs(diff)
                if abs_diff > allowed_minus:
                    score_penalty += rule["weight"]
                    warnings.append(f"{label} excede tolerancia mínima (-{round(abs_diff, 1)}mm)")
                else:
                    base_minus = rule["minus"] if rule["minus"] > 0 else 0.1
                    penalty = min(((abs_diff / base_minus) ** 2) * rule["weight"], rule["weight"])
                    score_penalty += penalty
                    if penalty < rule["weight"] * 0.1:
                        matches.append(f"{label} 99% similar")
                    else:
                        warnings.append(f"{label} -{round(abs_diff, 1)}mm")
                        
        final_score = 100.0
        if total_weight > 0:
            normalized_penalty = (score_penalty / total_weight) * 100.0
            final_score = 100.0 - normalized_penalty
            
        return max(0.0, final_score), matches, warnings

    @classmethod
    def _compute_confidence(cls, comparability: float, source_str: dict, cand_str: dict) -> float:
        """Stage 4: Confidence Score = 50% Comparability + 50% Critical Coverage"""
        critical_source_count = 0
        critical_cand_match = 0
        
        for label, val in source_str.items():
            if any(k in label.upper() for k in cls.CRITICAL_KEYWORDS):
                critical_source_count += 1
                if label in cand_str and cand_str[label] == val:
                    critical_cand_match += 1
                    
        critical_coverage = 100.0
        if critical_source_count > 0:
            critical_coverage = (critical_cand_match / critical_source_count) * 100.0
            
        return (comparability * 0.5) + (critical_coverage * 0.5)

    @classmethod
    async def find_alternatives(cls, sku: str, flexibility: str = "high") -> Dict[str, Any]:
        flex_multiplier = 1.0
        if flexibility == "medium": flex_multiplier = 2.5
        elif flexibility == "low": flex_multiplier = 4.0

        source_product = await Product.find_one({"sku": sku})
        if not source_product: raise ValueError(f"Product {sku} not found")

        cat_name = source_product.category_name
        if not cat_name: return {"status": "error", "message": "Product has no category"}

        direct_equivalences = [{"brand": e.brand, "code": e.code, "is_original": e.is_original} for e in source_product.equivalences]

        source_num = {}
        source_str = {}
        for s in source_product.specs:
            norm_label = cls._normalize_label(s.label)
            try: source_num[norm_label] = float(str(s.value).replace(',', '.'))
            except ValueError: source_str[norm_label] = str(s.value).strip().upper()

        # FIREWALL: If the source filter is completely empty (no numeric dimensions, no critical strings)
        if len(source_num) == 0 and not any(any(k in label.upper() for k in cls.CRITICAL_KEYWORDS) for label in source_str):
            return {
                "status": "success",
                "source_sku": sku,
                "category": cat_name,
                "official_equivalences": direct_equivalences,
                "dimensional_similarities": []
            }

        source_shape = cls.deduce_shape(source_num)
        cat_rules = cls.RULES.get(cat_name.upper(), {})

        query = {"category_name": cat_name, "sku": {"$ne": sku}, "status": "AVAILABLE"}
        and_conditions = []
        for label, val in source_str.items():
            if any(k in label.upper() for k in cls.CRITICAL_KEYWORDS):
                and_conditions.append({"specs": {"$elemMatch": {"label": label, "value": val}}})
        if and_conditions: query["$and"] = and_conditions

        candidates = await Product.find(query).to_list()
        results = []

        for cand in candidates:
            cand_num = {}
            cand_str = {}
            for s in cand.specs:
                norm_label = cls._normalize_label(s.label)
                try: cand_num[norm_label] = float(str(s.value).replace(',', '.'))
                except ValueError: cand_str[norm_label] = str(s.value).strip().upper()
                
            cand_shape = cls.deduce_shape(cand_num)
            
            # STAGE 1: Eligibility
            eligible, str_matches = cls._check_eligibility(source_shape, cand_shape, source_str, cand_str)
            if not eligible: continue
            
            # STAGE 2: Comparability
            comparability = cls._compute_comparability(source_num, cand_num, cat_rules)
            if comparability < 40.0: continue # STAGE 2 FILTER: KILL THE 64 FALSE POSITIVES
            
            # STAGE 3: Similarity
            similarity, num_matches, warnings = cls._compute_similarity(source_num, cand_num, cat_rules, flex_multiplier)
            
            # STAGE 4: Confidence
            confidence = cls._compute_confidence(comparability, source_str, cand_str)
            
            # STAGE 5: Ranking Score
            ranking_score = (similarity * 0.6) + (confidence * 0.4)
            
            if ranking_score >= 90: match_level = "Equivalencia prácticamente idéntica"
            elif ranking_score >= 80: match_level = "Compatible con revisión recomendada"
            elif ranking_score >= 70: match_level = "Posible reemplazo; revisar especificaciones"
            else: match_level = "No recomendado, evalúe tolerancias"
            
            results.append({
                "sku": cand.sku,
                "brand": cand.brand,
                "name": cand.name,
                "imageUrl": cand.image_url,
                "eligibility": True,
                "comparability": round(comparability, 1),
                "similarity_score": round(similarity, 1),
                "confidence_score": round(confidence, 1),
                "ranking_score": round(ranking_score, 1),
                "match_level": match_level,
                "evidence": {
                    "matches": str_matches + num_matches,
                    "warnings": warnings
                },
                "specs": [{"label": s.label, "display_label": getattr(s, "display_label", s.label), "value": s.value} for s in cand.specs]
            })

        results.sort(key=lambda x: x["ranking_score"], reverse=True)

        return {
            "status": "success",
            "source_sku": sku,
            "category": cat_name,
            "official_equivalences": direct_equivalences,
            "dimensional_similarities": results
        }
