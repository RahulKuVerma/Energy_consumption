# Authentication and Roles

The API requires a bearer token for application features. New registrations are created as users and cannot grant themselves administrator access.

On first startup, the backend creates an administrator using `ADMIN_USERNAME` and `ADMIN_PASSWORD`. For local development the defaults are `admin` and `admin123`; set both environment variables before deployment and use a strong `SECRET_KEY`.

Administrators can view all uploaded datasets, train the Linear Regression, XGBoost, and LSTM models against a selected dataset, and publish or unpublish models. Users can upload and access their own datasets and run forecasts only with published models. Analytics, alerts, and system settings are administrator-only.