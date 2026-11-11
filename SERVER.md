# Companion op een server

Normaal draait Companion op je laptop. Je kunt het ook op een server zetten die altijd aan staat, zoals een thuisserver, een Raspberry Pi of een VPS. Dit is voor wie al een server heeft en Docker kent. Gewoon op je laptop installeren staat in [INSTALL.md](INSTALL.md).

## Waarom

- Companion haalt elke 5 minuten je portfolio op, ook als je laptop dicht is.
- Het kan je een melding sturen als er iets gebeurt, bijvoorbeeld een nieuw niveau van je coach.
- Je hoeft veel minder vaak opnieuw in te loggen (zie hieronder).

## Je Canvas-sessie

Wat we hebben gemerkt:

- Canvas vernieuwt je sessie elke keer dat Companion inlogt. Zolang Companion blijft draaien en ophalen, blijft je sessie dus in leven. We hebben dat bijna een week getest met één keer inloggen per 6 uur, en de sessie leefde nog.
- Staat Companion ongeveer een dag uit, dan is de sessie verlopen en moet je opnieuw inloggen.

Op een laptop die 's nachts dicht gaat verloopt je sessie dus vaak. Op een server die aan blijft bijna nooit.

## Veiligheid

Companion heeft je Canvas-sessie. Wie Companion kan bereiken, kan dus bij je Canvas. Zet het daarom **nooit open op internet**. Er zijn twee veilige manieren:

1. **Alleen via Tailscale.** De container luistert alleen op de server zelf (`127.0.0.1`), en Tailscale geeft hem door aan je eigen apparaten. Niemand buiten je tailnet kan erbij. Dit is de makkelijkste manier.
2. **Achter een reverse proxy met login.** Heb je al een reverse proxy (Traefik, Caddy, nginx) met een login ervoor, zoals Authelia, Authentik of basic auth, dan kan Companion daarachter. Met een geheim dat alleen de proxy meestuurt, kan niets anders op de server de proxy overslaan.

Companion beantwoordt alleen verzoeken voor namen die het kent: `localhost` en wat je in `PORTFLOW_ALLOWED_HOSTS` zet. Wijzigingen vanaf andere sites weigert het altijd.

## Installeren

Je hebt Docker met docker compose nodig op de server.

1. Maak een lege map en zet [`compose.server.yaml`](compose.server.yaml) erin als `compose.yaml`.
2. Maak de mappen voor je gegevens: `mkdir -p cache .secrets`. De app in de container draait als gebruiker 1000. Heeft jouw gebruiker op de server een ander nummer (kijk met `id -u`), geef de mappen dan aan 1000: `sudo chown 1000:1000 cache .secrets`.
3. Kies een van de twee manieren hieronder en pas `compose.yaml` daarop aan.
4. Stel meldingen in, of haal de regels voor meldingen weg (zie [Meldingen](#meldingen)).
5. Start: `docker compose up -d`.

### Manier 1: Tailscale

Zet [Tailscale](https://tailscale.com/download) op de server en op je eigen apparaten, in hetzelfde tailnet. Zet in de Tailscale-adminconsole onder DNS **MagicDNS** en **HTTPS Certificates** aan.

Laat `compose.yaml` zoals het is: de poort blijft `127.0.0.1:8000:8000`. Zet Companion daarna in je tailnet, op de server:

```sh
sudo tailscale serve --bg http://127.0.0.1:8000
```

Tailscale laat het adres zien, zoals `https://jouw-server.jouw-tailnet.ts.net`. Dit blijft ook na een herstart aan. Zet die naam (zonder `https://`) in `compose.yaml` bij `PORTFLOW_ALLOWED_HOSTS`, en het hele adres bij `PORTFLOW_PUBLIC_URL`. Start daarna opnieuw met `docker compose up -d`.

Controleren kan met `tailscale serve status`, uitzetten met `sudo tailscale serve reset`.

### Manier 2: reverse proxy met login

- Haal in `compose.yaml` het blok `ports` weg en zet het netwerk van je proxy aan (de regels bij "Option 2"). Zo is de app alleen via de proxy te bereiken.
- Zet het adres waarop je proxy Companion aanbiedt bij `PORTFLOW_ALLOWED_HOSTS` (alleen de naam, zoals `companion.jouwdomein.nl`) en bij `PORTFLOW_PUBLIC_URL` (het hele adres).
- Maak een geheim: `openssl rand -hex 32 > proxy-secret.txt`, en zet `PORTFLOW_PROXY_SECRET_FILE` en `proxy_secret` aan. Companion antwoordt dan alleen op verzoeken met dat geheim in de header `X-Proxy-Secret`.
- Laat je proxy die header bij elk verzoek meesturen, en zorg dat de proxy eerst om een login vraagt. Hoe dat gaat hangt af van je proxy.

Zonder login op de proxy kan iedereen met het adres bij je Canvas. Sla die stap niet over.

`/healthz` antwoordt altijd, ook zonder geheim. Het geeft alleen `{"ok": true}` terug, voor een uptime-monitor.

## Inloggen

Ga naar het adres van Companion en plak je Canvas-cookies, net als op een laptop. De app legt uit hoe je ze vindt.

Companion Login (het programmaatje voor inloggen met één klik) werkt alleen met Companion op je eigen computer. Op een server plak je de cookies met de hand. Dat hoeft maar zelden, omdat de sessie op een server blijft leven.

## Meldingen

Companion kan meldingen sturen via [ntfy](https://ntfy.sh): een gratis app voor Android en iOS, en een website.

1. Bedenk een onderwerp (topic) dat niemand kan raden, bijvoorbeeld met `echo companion-$(openssl rand -hex 12)`. Een topic op `ntfy.sh` kan iedereen lezen die de naam kent. Een naam als `companion-jan` is dus niet veilig. Heb je een eigen ntfy-server, dan kun je die ook gebruiken.
2. Zet het adres in `notify-url.txt` naast `compose.yaml`, op één regel, zoals `https://ntfy.sh/companion-3f9a...`. Het bestand moet leesbaar zijn voor gebruiker 1000.
3. Abonneer je in de ntfy-app op hetzelfde topic.
4. Zet `PORTFLOW_PUBLIC_URL` op het adres van Companion. Dan opent een tik op een melding Companion. Zonder dit adres krijg je de meldingen ook, maar zonder link.
5. Start opnieuw met `docker compose up -d` en stuur een testmelding vanuit **Instellingen**, onder **Meldingen**.

Companion stuurt een melding als:

- je cookies verlopen zijn en je opnieuw moet inloggen;
- een coach een evaluatie op een nieuw niveau heeft beoordeeld;
- een evaluatie is teruggestuurd;
- er nieuwe feedback op je bewijs is;
- het maandag is: dan krijg je de taken van deze week.

Geen meldingen? Haal dan in `compose.yaml` de regels met `PORTFLOW_NOTIFY_URL_FILE` en `notify_url` weg (bij `environment`, `secrets` en onderaan).

## Verhuizen van je laptop

Je planning, concepten en instellingen neem je mee met een back-up:

1. Open Companion op je laptop, ga naar **Instellingen**, **Back-up** en klik op **Exporteren**. Je krijgt een bestand `companion-backup-<datum>.json`.
2. Open Companion op de server, ga naar dezelfde plek, klik op **Importeren** en kies dat bestand. Companion laat zien wat erin zit en vraagt of het je huidige gegevens mag vervangen.
3. Log op de server opnieuw in met je cookies. Cookies zitten nooit in een back-up.
4. Stop Companion op je laptop: `docker stop portflow-companion`. Anders halen twee kopieën tegelijk op met jouw login.

Je portfolio zelf zit niet in de back-up: de server haalt het opnieuw op uit Portflow. De eerste keer duurt dat een paar minuten.

De export is ook een goede reservekopie. Maak er af en toe een, bijvoorbeeld voor je een nieuw semester instelt.

## Bijwerken

Is er een nieuwe versie, dan staat dat links onderin. Op de server, in de map met `compose.yaml`:

```sh
docker compose pull
docker compose up -d
```

Je gegevens staan in `cache` en `.secrets` en blijven bij bijwerken gewoon bestaan.

## Werkt het niet?

- **"Unknown host"**: de naam waarmee je Companion opent staat niet in `PORTFLOW_ALLOWED_HOSTS`. Zet hem erbij (alleen de naam, zonder `https://` of poort) en start opnieuw.
- **"Requests must come through the reverse proxy"**: je proxy stuurt de header `X-Proxy-Secret` niet mee, of met een andere waarde dan in `proxy-secret.txt`.
- **De container start niet en meldt iets over `notify-url.txt`**: het bestand bestaat niet. Maak het aan, of haal de regels voor meldingen weg.
- **Iets anders**: meld het via **Idee of probleem** links onderin de app.
