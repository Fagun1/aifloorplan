from fastapi import APIRouter, HTTPException

from backend.api.v1.schemas.plot import PlotIn, PlotOut
from backend.api.v1.dependencies import get_geometry_engine

router = APIRouter(tags=["plots"])


@router.post("/plots/validate", response_model=PlotOut)
def validate_plot(plot: PlotIn) -> PlotOut:
    geometry = get_geometry_engine()
    try:
        validated = geometry.validate_polygon(plot.points)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    bbox = geometry.bounding_box(validated)
    area = geometry.area(validated)
    return PlotOut(
        points=plot.points,
        gate_direction=plot.gate_direction,
        area_m2=area,
        bbox=bbox,
        is_valid=True,
    )

