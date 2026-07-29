# guiaVietnam

Guía de viaje interactiva — **Vietnam + Camboya, 11–26 de septiembre de 2026** (Hanoi · Ninh Binh · Ha Giang · Angkor).

Proyecto hermano de [guiaRoma](https://github.com/psl11/guiaRoma), del que reutiliza el estilo de guía HTML.

## Documentos

- [`brief-viaje-vietnam-camboya.md`](brief-viaje-vietnam-camboya.md) — brief original con las decisiones cerradas (vuelos, calendario, seguros).
- [`referencia-vietnam-camboya.md`](referencia-vietnam-camboya.md) — documento de referencia extenso (research verificado 2025-2026): Parte I logística validada, Parte II corpus cultural narrativo. **Fuente única para construir la guía HTML.**
- `index.html` — la guía (pendiente de construir).

## Antes de volar, compruébalo

La guía funciona **sin conexión**, pero eso hay que verificarlo con wifi y no en el aeropuerto:
ábrela, déjala un minuto —son unos 17 MB, se descargan una sola vez—, **pon el móvil en modo avión y
recárgala**. Si carga entera, está lista.

No es paranoia: el offline estuvo roto en las dos guías hasta el 29 de julio de 2026 y **no había
forma de notarlo con cobertura**, porque un sitio sin offline se ve exactamente igual que uno con
offline mientras haya red. Ahora hay una puerta automática (`scripts/check-offline.mjs`, en CI), pero
la prueba del modo avión sigue siendo la que manda.
