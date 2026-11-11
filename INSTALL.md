# Companion installeren

Companion draait in Docker op je eigen computer. Wat het is en wat je ermee kunt staat in de [README](README.md).

## Wat je nodig hebt

[Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows, macOS) of Docker (Linux). Start het één keer, zodat het draait.

## Installeren

Open een terminal (Windows: PowerShell) en plak dit:

```sh
docker run -d --name portflow-companion --restart unless-stopped -p 127.0.0.1:8000:8000 -v portflow-companion:/data ghcr.io/ldideric/portflow-companion:latest
```

Ga daarna naar **<http://localhost:8000>** en volg de stappen:

1. Plak je Canvas-cookies. De app legt uit hoe je ze vindt; het kost een halve minuut.
2. Wacht tot je portfolio is opgehaald. De eerste keer duurt dat een paar minuten, omdat al je bestanden worden gedownload. Daarna gaat vernieuwen in een paar seconden.
3. Controleer je semester en maak een planning.

Companion start voortaan vanzelf als Docker draait.

## Cookies verlopen

Canvas-cookies verlopen, meestal na ongeveer een dag. Companion vraagt dan om nieuwe, zonder dat je opnieuw begint: je planning, concepten en gegevens blijven staan. In Instellingen zie je wanneer je cookies voor het laatst werkten.

## Bijwerken

Is er een nieuwe versie, dan staat dat links onderin. Klik op het vraagteken voor de stappen. Met de installatie hierboven is dat:

```sh
docker pull ghcr.io/ldideric/portflow-companion:latest
docker rm -f portflow-companion
docker run -d --name portflow-companion --restart unless-stopped -p 127.0.0.1:8000:8000 -v portflow-companion:/data ghcr.io/ldideric/portflow-companion:latest
```

Je gegevens staan in het Docker-volume `portflow-companion` en blijven bij bijwerken gewoon bestaan. Na het bijwerken zie je op het overzicht wat er nieuw is.

## Stoppen of verwijderen

- Stoppen: `docker stop portflow-companion` (weer starten: `docker start portflow-companion`).
- Verwijderen, inclusief je gegevens: `docker rm -f portflow-companion` en daarna `docker volume rm portflow-companion`.

## Liever docker compose?

Zet [`compose.yaml`](compose.yaml) uit deze repository in een lege map en voer daar uit:

```sh
mkdir -p cache .secrets
docker compose up -d
```

Je gegevens staan dan in de mappen `cache` en `.secrets` naast het bestand. Bijwerken: `docker compose pull` en daarna `docker compose up -d`.

## Op een server

Wil je dat Companion ook ophaalt en je meldingen stuurt als je laptop dicht is? Zet het op een server die altijd aan staat: [SERVER.md](SERVER.md).

## Werkt het niet?

- **"port is already allocated"**: iets anders gebruikt poort 8000. Maak in het commando van `127.0.0.1:8000:8000` dan `127.0.0.1:8080:8000` en ga naar <http://localhost:8080>. Gebruik dat ook bij bijwerken.
- **De pagina laadt niet**: draait Docker? Kijk met `docker ps` of `portflow-companion` erbij staat.
- **"Iets op deze computer onderschept beveiligde verbindingen"**: een virusscanner, adblocker of proxy controleert je HTTPS-verkeer, en Docker stuurt Companion daar ook doorheen. Zet in Docker Desktop bij Settings, Resources, Proxies de handmatige instelling aan en laat de velden leeg. Of zet `canvas.hu.nl`, `canvaslms.com`, `drieam.app` en `amazonaws.com` in dat programma bij de uitzonderingen.
- **Iets anders**: meld het via **Idee of probleem** links onderin de app.
