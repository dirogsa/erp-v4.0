from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from app.services.data_exchange_service import DataExchangeService
import io

router = APIRouter(prefix="/io", tags=["Data Exchange"])

@router.get("/export/{entity}")
async def export_entity(entity: str):
    try:
        csv_data = await DataExchangeService.export_to_csv(entity)
        return StreamingResponse(
            io.StringIO(csv_data),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={entity}.csv"}
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.post("/import/{entity}")
async def import_entity(entity: str, file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        content = await file.read()
        decoded = content.decode('utf-8')
        result = await DataExchangeService.import_from_csv(entity, decoded)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
