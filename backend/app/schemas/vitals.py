from pydantic import BaseModel, model_validator
from datetime import datetime
from typing import Optional
import re


class VitalsCreate(BaseModel):
    visit_id: int
    
    # Hospital Sheet Vitals
    weight_kg: Optional[float] = None  # Max 200
    height_cm: Optional[float] = None  # Max 250
    bmi: Optional[float] = None
    blood_pressure: Optional[str] = None  # e.g., "110/80"
    temperature_f: Optional[float] = None  # e.g., 98.5
    spo2_percent: Optional[int] = None  # Max 100
    pulse_rate_bpm: Optional[int] = None
    grbs_mg_dl: Optional[int] = None
    consultant_assigned: Optional[str] = None
    remarks: Optional[str] = None

    # Legacy fields
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    pr: Optional[int] = None
    spo2: Optional[int] = None
    sugar: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def reconcile_vitals(cls, values):
        if not isinstance(values, dict):
            return values

        # Weight validation (Max 200) & sync
        w = values.get("weight_kg") if values.get("weight_kg") is not None else values.get("weight")
        if w is not None:
            w_float = float(w)
            if w_float > 200 or w_float < 0:
                raise ValueError("Weight must be between 0 and 200 kg")
            values["weight_kg"] = w_float
            values["weight"] = w_float

        # Height validation (Max 250)
        h = values.get("height_cm")
        if h is not None:
            h_float = float(h)
            if h_float > 250 or h_float < 0:
                raise ValueError("Height must be between 0 and 250 cm")
            values["height_cm"] = h_float

        # Auto-calculate BMI if weight and height are present
        if values.get("weight_kg") and values.get("height_cm"):
            try:
                w_val = float(values["weight_kg"])
                h_val = float(values["height_cm"])
                if h_val > 0:
                    bmi_val = round(w_val / ((h_val / 100.0) ** 2), 1)
                    values["bmi"] = bmi_val
            except Exception:
                pass

        # Blood Pressure sync
        bp = values.get("blood_pressure")
        if bp and isinstance(bp, str) and "/" in bp:
            parts = bp.split("/")
            if len(parts) == 2 and parts[0].strip().isdigit() and parts[1].strip().isdigit():
                values["bp_systolic"] = int(parts[0].strip())
                values["bp_diastolic"] = int(parts[1].strip())
        elif values.get("bp_systolic") is not None and values.get("bp_diastolic") is not None:
            values["blood_pressure"] = f"{values['bp_systolic']}/{values['bp_diastolic']}"

        # Temperature sync (°F <-> °C)
        t_f = values.get("temperature_f")
        t_c = values.get("temperature")
        if t_f is not None:
            t_f_float = float(t_f)
            values["temperature_f"] = t_f_float
            values["temperature"] = round((t_f_float - 32) * 5 / 9, 2)
        elif t_c is not None:
            t_c_float = float(t_c)
            values["temperature"] = t_c_float
            values["temperature_f"] = round((t_c_float * 9 / 5) + 32, 1)

        # SpO2 validation (Max 100) & sync
        s = values.get("spo2_percent") if values.get("spo2_percent") is not None else values.get("spo2")
        if s is not None:
            s_int = int(s)
            if s_int > 100 or s_int < 0:
                raise ValueError("SpO2 must be between 0 and 100%")
            values["spo2_percent"] = s_int
            values["spo2"] = s_int

        # Pulse Rate sync
        p = values.get("pulse_rate_bpm") if values.get("pulse_rate_bpm") is not None else values.get("pr")
        if p is not None:
            p_int = int(p)
            values["pulse_rate_bpm"] = p_int
            values["pr"] = p_int

        # GRBS / Sugar sync
        g = values.get("grbs_mg_dl") if values.get("grbs_mg_dl") is not None else values.get("sugar")
        if g is not None:
            g_val = int(float(g))
            values["grbs_mg_dl"] = g_val
            values["sugar"] = float(g_val)

        return values


class VitalsUpdate(BaseModel):
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    bmi: Optional[float] = None
    blood_pressure: Optional[str] = None
    temperature_f: Optional[float] = None
    spo2_percent: Optional[int] = None
    pulse_rate_bpm: Optional[int] = None
    grbs_mg_dl: Optional[int] = None
    consultant_assigned: Optional[str] = None
    remarks: Optional[str] = None

    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    pr: Optional[int] = None
    spo2: Optional[int] = None
    sugar: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def reconcile_update_vitals(cls, values):
        if not isinstance(values, dict):
            return values
        # Weight
        if values.get("weight_kg") is not None:
            values["weight"] = values["weight_kg"]
        elif values.get("weight") is not None:
            values["weight_kg"] = values["weight"]
        # Temp
        if values.get("temperature_f") is not None:
            values["temperature"] = round((float(values["temperature_f"]) - 32) * 5 / 9, 2)
        elif values.get("temperature") is not None:
            values["temperature_f"] = round((float(values["temperature"]) * 9 / 5) + 32, 1)
        # BP
        if values.get("blood_pressure") and "/" in str(values["blood_pressure"]):
            parts = str(values["blood_pressure"]).split("/")
            if len(parts) == 2 and parts[0].strip().isdigit() and parts[1].strip().isdigit():
                values["bp_systolic"] = int(parts[0].strip())
                values["bp_diastolic"] = int(parts[1].strip())
        elif values.get("bp_systolic") is not None and values.get("bp_diastolic") is not None:
            values["blood_pressure"] = f"{values['bp_systolic']}/{values['bp_diastolic']}"
        # SpO2
        if values.get("spo2_percent") is not None:
            values["spo2"] = values["spo2_percent"]
        elif values.get("spo2") is not None:
            values["spo2_percent"] = values["spo2"]
        # PR
        if values.get("pulse_rate_bpm") is not None:
            values["pr"] = values["pulse_rate_bpm"]
        elif values.get("pr") is not None:
            values["pulse_rate_bpm"] = values["pr"]
        # Sugar
        if values.get("grbs_mg_dl") is not None:
            values["sugar"] = float(values["grbs_mg_dl"])
        elif values.get("sugar") is not None:
            values["grbs_mg_dl"] = int(float(values["sugar"]))
        return values


class VitalsResponse(BaseModel):
    id: int
    visit_id: int
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    bmi: Optional[float] = None
    blood_pressure: Optional[str] = None
    temperature_f: Optional[float] = None
    spo2_percent: Optional[int] = None
    pulse_rate_bpm: Optional[int] = None
    grbs_mg_dl: Optional[int] = None
    consultant_assigned: Optional[str] = None
    remarks: Optional[str] = None

    # Legacy fields
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    pr: Optional[int] = None
    spo2: Optional[int] = None
    sugar: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

