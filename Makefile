# Comandos de desenvolvimento do Shello (Flutter). Veja README.md.

.PHONY: setup run web test analyze apk web-build

setup:
	flutter pub get

run:
	flutter run

web:
	flutter run -d chrome --web-browser-flag=--window-size=390,844

test:
	flutter test

analyze:
	flutter analyze
	dart format --output=none --set-exit-if-changed lib test

apk:
	flutter build apk --debug

web-build:
	flutter build web --release --no-web-resources-cdn
