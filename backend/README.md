# Phase 1 Backend (Geometry + Simple Layout + Scoring)

Implements **Phase 1 only**:
- Geometry engine: polygon validation, area, bounding box, simple setback
- Simple layout generator: random partitioning + basic adjacency
- Basic scoring: space utilization, natural light access, privacy score

## Run

```bash
python -m pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

## Generate layouts

POST `http://localhost:8000/api/v1/layouts/generate`

Example JSON body:

```json
{
  "plot": {
    "points": [[0,0],[20,0],[20,10],[12,14],[0,10]],
    "gate_direction": "south"
  },
  "setback_m": 1.0,
  "num_candidates": 5,
  "generation_seed": 42,
  "rooms": [
    {"name":"Living","target_area":40,"category":"public"},
    {"name":"Kitchen","target_area":20,"category":"service"},
    {"name":"Bed1","target_area":18,"category":"private"},
    {"name":"Bed2","target_area":18,"category":"private"}
  ]
}
```

Response returns candidates with room polygons (as coordinates), adjacency edges, and metric scores.

