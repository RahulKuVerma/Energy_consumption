import io

def test_file_upload_validation(admin_client):
    # Attempt invalid file extension
    invalid_file = io.BytesIO(b"dummy data")
    response = admin_client.post(
        "/api/upload/file",
        files={"file": ("test.exe", invalid_file, "application/octet-stream")}
    )
    assert response.status_code == 400
    assert "Unsupported file extension" in response.json()["detail"]

def test_csv_upload_inspection(admin_client):
    csv_content = (
        "Date;Time;Global_active_power;Global_reactive_power;Voltage;Global_intensity;Sub_metering_1;Sub_metering_2;Sub_metering_3\n"
        "28/09/2026;12:00:00;1.42;0.12;234.5;6.1;0.0;1.0;17.0\n"
        "28/09/2026;13:00:00;1.85;0.18;233.8;8.0;0.0;2.0;18.0\n"
        "28/09/2026;14:00:00;2.10;0.22;232.1;9.2;0.0;1.0;19.0\n"
        "28/09/2026;15:00:00;1.95;0.15;234.0;8.5;0.0;1.0;18.0\n"
        "28/09/2026;16:00:00;2.30;0.20;233.5;10.1;1.0;2.0;20.0\n"
    ).encode("utf-8")

    file_obj = io.BytesIO(csv_content)
    response = admin_client.post(
        "/api/upload/file",
        files={"file": ("household_sample.txt", file_obj, "text/plain")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["detected_delimiter"] == ";"
    assert "suggested_mappings" in data
    assert data["suggested_mappings"]["global_active_power"] == "Global_active_power"
