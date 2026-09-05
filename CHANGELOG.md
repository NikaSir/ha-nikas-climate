# Changelog

## 0.1.0 — 2026-09-05

- Создан автономный репозиторий NikaS Climate.
- Добавлена интеграция Home Assistant `nikas_climate`.
- Зарегистрирован маршрут `/dashboard-climate-v1/home`.
- Добавлен стартовый mobile-first интерфейс для двух кондиционеров Syncleo.
- Контрольная температура помещений привязана к `sensor.sensor_th_zb_11_temperature` и `sensor.sensor_th_zb_14_temperature`.
- Основной канал управления зафиксирован как локальный Syncleo UDP/LAN.
