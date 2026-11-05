# Portflow Companion

Voor HU Open-ICT-studenten die Portflow gebruiken. Portflow toont je evaluaties en bewijsstukken los van elkaar. Wat je er niet makkelijk in ziet: waar je staat over het hele semester, wat je deze week moet doen, en of een evaluatie klaar is om in te dienen. Companion haalt je portfolio op naar je eigen computer en laat dat wel zien.

Companion is een project van een student. Het is niet verbonden aan, goedgekeurd door of gelieerd met Hogeschool Utrecht of Drieam.

## Wat je ermee kunt

- **Zien waar je staat.** Hoeveel weken je nog hebt, hoeveel evaluaties je hebt ingediend, welk niveau de coach per vaardigheid gaf en wat er nog moet.
- **Plannen.** Welke evaluatie je in welke week schrijft. Companion stelt een planning voor en past hem aan als je achterloopt. Elke week maak je er een afbeelding van, als bewijs voor Plannen (PL).
- **Weten wat je nu moet doen.** Taken die naar echte dingen wijzen: deze evaluatie is te laat, dit bewijsstuk heeft nog geen feedback, deze persoon heeft je feedbackverzoek nog niet beantwoord.
- **Je evaluatie schrijven.** Met de LEF-criteria, wat de coach de vorige keer zei en de feedback op je bewijs ernaast. Tag bewijs met `@` en plak de tekst daarna in Portflow, tags inbegrepen.
- **Fouten voorkomen.** Elke evaluatie moet minstens één bewijsstuk taggen met feedback van iemand anders. Companion laat zien welk bewijs dat heeft, en waarschuwt als het ontbreekt.
- **Bijhouden wat er veranderd is.** Een beoordeling, een teruggestuurde evaluatie of nieuwe feedback sinds je laatste bezoek.

## Je gegevens

- Alles staat op je eigen computer. Companion leest uit Portflow en verandert daar niets, met één uitzondering: de naamhulp past namen van bewijsstukken aan, maar alleen als jij de lijst hebt gecontroleerd en bevestigd. Daarbij wordt nooit iets verwijderd.
- Je Canvas-cookies blijven op je computer en gaan nergens anders heen.
- Alleen wat je zelf meldt via **Idee of probleem** gaat naar de maker. Je ziet eerst precies wat er verstuurd wordt. Onder **Privacy** in dat formulier staat waar je bericht terechtkomt, hoe lang het blijft en hoe je het laat verwijderen.

## Installeren

Je hebt [Docker Desktop](https://www.docker.com/products/docker-desktop/) nodig (Windows, macOS) of Docker (Linux). Plak daarna dit in een terminal (Windows: PowerShell) en ga naar <http://localhost:8000>:

```sh
docker run -d --name portflow-companion --restart unless-stopped -p 127.0.0.1:8000:8000 -v portflow-companion:/data ghcr.io/ldideric/portflow-companion:latest
```

Bijwerken, stoppen, verwijderen, docker compose en wat je doet als het niet werkt: [INSTALL.md](INSTALL.md).

## Companion Login

Inloggen gaat nu met je Canvas-cookies, en die verlopen meestal na ongeveer een dag. Companion Login is een klein programma dat Canvas in een eigen venster opent en je sessie aan Companion op je computer geeft, zodat opnieuw inloggen één klik is. Het is nog niet als download beschikbaar. De code staat in [`login/`](login/), zodat iedereen kan nagaan wat het met je login doet: je sessie gaat alleen naar Companion op je eigen computer.

## Nieuwe versies

Wat er per versie veranderd is staat bij [Releases](../../releases). Companion zegt het zelf als er een nieuwe versie is, en laat na het bijwerken zien wat er nieuw is.

De code van Companion zelf is niet openbaar. Problemen en ideeën meld je in de app via **Idee of probleem**.
