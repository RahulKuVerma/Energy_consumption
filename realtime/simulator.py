import time
import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from realtime.data_stream import EnergyDataStream
from realtime.api_adapter import api_adapter

def run_simulator(frequency: float = 2.0, count: int = 50, dataset_id: int = 1):
    print(f"Starting Real-Time Energy Telemetry Simulator...")
    print(f"Target dataset ID: {dataset_id} | Frequency: {frequency}s | Steps: {count}")
    
    streamer = EnergyDataStream(frequency_seconds=frequency)
    step = 0
    
    try:
        for reading in streamer.stream_readings():
            step += 1
            result = api_adapter.ingest_reading(reading, dataset_id=dataset_id)
            d = result["data"]
            alert_str = f" [ALERT FIRED: #{result['alert_id']}]" if result["alert_fired"] else ""
            print(f"[{step}/{count}] {d['timestamp']} | Power: {d['global_active_power']:.2f} kW | Energy: {d['energy_consumption_kwh']:.3f} kWh | Volt: {d['voltage']}V{alert_str}")
            
            if count > 0 and step >= count:
                break
    except KeyboardInterrupt:
        print("\nSimulator stopped by user.")
    print("Real-time simulation complete.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Real-time Smart Meter Simulation")
    parser.add_argument("--freq", type=float, default=2.0, help="Interval in seconds between readings")
    parser.add_argument("--count", type=int, default=30, help="Total number of readings to generate (0 for infinite)")
    parser.add_argument("--dataset-id", type=int, default=1, help="Associated dataset ID")
    args = parser.parse_args()

    run_simulator(frequency=args.freq, count=args.count, dataset_id=args.dataset_id)
