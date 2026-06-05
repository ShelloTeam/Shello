.PHONY: dev apk setup check

ifeq ($(OS),Windows_NT)
    SETUP_CMD = powershell -ExecutionPolicy Bypass -File .\setup.ps1
else
    SETUP_CMD = ./setup.sh
endif

setup:
	@$(SETUP_CMD)

dev:
	cd frontend && npx expo start --tunnel

apk:
	cd frontend && eas build --platform android --profile preview

check:
	cd frontend && npm run ts-check



