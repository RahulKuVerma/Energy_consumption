import time
from datetime import datetime, timedelta
import numpy as np
from typing import Generator, Dict, Any

class EnergyDataStream:
    """
    Simulates a streaming IoT smart meter publishing readings at regular intervals.
    Generates realistic diurnal power fluctuations, periodic kitchen/laundry events,
    and grid voltage dynamics.
    """
    def __init__(self, frequency_seconds: float = 2.0, noise_factor: float = 0.05):
        self.frequency = frequency_seconds
        self.noise_factor = noise_factor
        self.current_time = datetime.now()

    def stream_readings(self) -> Generator[Dict[str, Any], None, None]:
        while True:
            self.current_time += timedelta(minutes=15)
            hr = self.current_time.hour
            day_of_week = self.current_time.weekday()
            is_weekend = day_of_week in [5, 6]

            # Realistic diurnal profile
            base_kw = 0.6 + 0.5 * np.sin((hr - 6) * np.pi / 12)
            if 7 <= hr <= 9:
                base_kw += 1.4  # Morning breakfast peak
            elif 18 <= hr <= 22:
                base_kw += 2.2  # Evening dinner & entertainment peak
            elif 1 <= hr <= 5:
                base_kw = 0.35  # Nighttime standby load

            if is_weekend:
                base_kw *= 1.2

            active_power = max(0.15, float(base_kw + np.random.normal(0, self.noise_factor * base_kw)))
            reactive_power = max(0.02, float(active_power * 0.14 + np.random.normal(0, 0.01)))
            voltage = float(234.0 + np.random.normal(0, 1.8) - (0.4 * active_power))
            current = float((active_power * 1000.0) / max(200.0, voltage))

            # 15-minute energy in kWh = active_power * 0.25h
            energy_kwh = float(round(active_power * 0.25, 4))

            # Submeterings in Watt-hours
            sub1 = max(0.0, float(np.random.normal(12.0, 3.0))) if hr in [8, 19] else 0.0
            sub2 = max(0.0, float(np.random.normal(20.0, 4.0))) if (is_weekend and hr == 11) else 0.0
            sub3 = max(2.0, float((10.0 if 12 <= hr <= 22 else 3.0) + np.random.normal(0, 1.5)))

            reading = {
                "timestamp": self.current_time.strftime("%Y-%m-%d %H:%M:%S"),
                "global_active_power": round(active_power, 3),
                "global_reactive_power": round(reactive_power, 3),
                "voltage": round(voltage, 1),
                "global_intensity": round(current, 2),
                "energy_consumption_kwh": energy_kwh,
                "sub_metering_1": round(sub1, 1),
                "sub_metering_2": round(sub2, 1),
                "sub_metering_3": round(sub3, 1)
            }

            yield reading
            time.sleep(self.frequency)

data_stream = EnergyDataStream()
