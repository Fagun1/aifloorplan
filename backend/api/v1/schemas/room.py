from typing import Literal

from pydantic import Field

from backend.api.v1.schemas.common import APIModel

RoomCategory = Literal["public", "private", "service"]


class RoomSpec(APIModel):
    name: str = Field(min_length=1)
    target_area: float = Field(gt=0)
    category: RoomCategory = "public"

