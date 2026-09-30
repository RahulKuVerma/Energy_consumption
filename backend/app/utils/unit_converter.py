from typing import Dict, Any

CO2_KG_PER_KWH = 0.385  # Global average grid carbon intensity (kg CO2 / kWh)

def watts_to_kilowatts(watts: float) -> float:
    return watts / 1000.0

def kilowatts_to_watts(kw: float) -> float:
    return kw * 1000.0

def power_to_energy_kwh(power_kw: float, hours: float = 1.0) -> float:
    """Calculates Energy in kWh from average Power (kW) over a duration in hours."""
    return power_kw * hours

def watt_hours_to_kwh(wh: float) -> float:
    return wh / 1000.0

def calculate_energy_cost(kwh: float, rate_per_kwh: float = 0.18) -> float:
    """Calculates estimated financial cost based on kWh consumed."""
    return round(kwh * rate_per_kwh, 2)

def calculate_carbon_footprint_kg(kwh: float, factor: float = CO2_KG_PER_KWH) -> float:
    """Calculates carbon footprint in kg CO2 equivalent."""
    return round(kwh * factor, 2)

def convert_submetering_wh_to_kwh(sub1_wh: float, sub2_wh: float, sub3_wh: float) -> Dict[str, float]:
    """
    Submeterings in UCI dataset are measured in Watt-hours.
    This helper converts them to kWh.
    """
    return {
        "kitchen_kwh": round(sub1_wh / 1000.0, 4),
        "laundry_kwh": round(sub2_wh / 1000.0, 4),
        "climate_kwh": round(sub3_wh / 1000.0, 4)
    }
