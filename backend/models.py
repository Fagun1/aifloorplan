"""
SQLAlchemy ORM models for all database entities.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base


# ─────────────────────────────────────────────────────────────────────────────
# Users
# ─────────────────────────────────────────────────────────────────────────────


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    subscription: Mapped[str] = mapped_column(String(50), default="free")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    projects: Mapped[list["Project"]] = relationship("Project", back_populates="user", cascade="all, delete-orphan")


# ─────────────────────────────────────────────────────────────────────────────
# Projects
# ─────────────────────────────────────────────────────────────────────────────


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, generating, layout_ready, editing, exported
    num_floors: Mapped[int] = mapped_column(Integer, default=1)
    gate_direction: Mapped[str] = mapped_column(String(50), default="south")
    road_adjacency: Mapped[list] = mapped_column(JSON, default=list)
    parking_config: Mapped[dict] = mapped_column(JSON, default=dict)
    generation_seed: Mapped[int] = mapped_column(Integer, default=42)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="projects")
    plot: Mapped["Plot | None"] = relationship("Plot", back_populates="project", uselist=False, cascade="all, delete-orphan")
    room_requirements: Mapped[list["RoomRequirement"]] = relationship("RoomRequirement", back_populates="project", cascade="all, delete-orphan")
    layouts: Mapped[list["Layout"]] = relationship("Layout", back_populates="project", cascade="all, delete-orphan")
    question_sessions: Mapped[list["QuestionSession"]] = relationship("QuestionSession", back_populates="project", cascade="all, delete-orphan")


# ─────────────────────────────────────────────────────────────────────────────
# Plots
# ─────────────────────────────────────────────────────────────────────────────


class Plot(Base):
    __tablename__ = "plots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Polygon vertices [[x, y], ...]
    vertices: Mapped[list] = mapped_column(JSON, nullable=False)

    # Computed
    area_sqm: Mapped[float | None] = mapped_column(Float)
    perimeter_m: Mapped[float | None] = mapped_column(Float)
    bounding_box: Mapped[dict | None] = mapped_column(JSON)
    centroid: Mapped[dict | None] = mapped_column(JSON)

    # Setbacks
    setback_m: Mapped[float] = mapped_column(Float, default=1.0)
    setback_config: Mapped[dict] = mapped_column(JSON, default=lambda: {"front": 4.5, "rear": 3.0, "left": 2.0, "right": 2.0})
    buildable_vertices: Mapped[list | None] = mapped_column(JSON)
    buildable_area_sqm: Mapped[float | None] = mapped_column(Float)

    # Validation
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True)
    validation_issues: Mapped[list] = mapped_column(JSON, default=list)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project: Mapped["Project"] = relationship("Project", back_populates="plot")


# ─────────────────────────────────────────────────────────────────────────────
# Room Requirements
# ─────────────────────────────────────────────────────────────────────────────


class RoomRequirement(Base):
    __tablename__ = "room_requirements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "Bed1"
    category: Mapped[str] = mapped_column(String(50), default="private")  # public/private/service
    target_area_sqm: Mapped[float] = mapped_column(Float, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=5)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    project: Mapped["Project"] = relationship("Project", back_populates="room_requirements")


# ─────────────────────────────────────────────────────────────────────────────
# Layouts
# ─────────────────────────────────────────────────────────────────────────────


class Layout(Base):
    __tablename__ = "layouts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_index: Mapped[int] = mapped_column(Integer, nullable=False)
    is_selected: Mapped[bool] = mapped_column(Boolean, default=False)
    is_user_modified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Full candidate data as JSON (rooms, doors, adjacency, etc.)
    candidate_data: Mapped[dict] = mapped_column(JSON, nullable=False)

    # Scoring
    total_score: Mapped[float | None] = mapped_column(Float)
    dimension_scores: Mapped[dict | None] = mapped_column(JSON)

    # Generation metadata
    generation_seed: Mapped[int | None] = mapped_column(Integer)
    generation_time_ms: Mapped[int | None] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project: Mapped["Project"] = relationship("Project", back_populates="layouts")


# ─────────────────────────────────────────────────────────────────────────────
# Question Sessions
# ─────────────────────────────────────────────────────────────────────────────


class QuestionSession(Base):
    __tablename__ = "question_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    round_number: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, answered
    questions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    answers: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    project: Mapped["Project"] = relationship("Project", back_populates="question_sessions")
