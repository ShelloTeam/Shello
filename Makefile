.PHONY: dev apk backend down setup

setup:
	powershell -ExecutionPolicy Bypass -File .\setup.ps1

dev:
	docker-compose up --build -d
	cd frontend && npx expo start --tunnel

apk:
	docker-compose up --build -d
	cd frontend && eas build --platform android --profile preview

backend:
	docker-compose up --build

down:
	docker-compose down
