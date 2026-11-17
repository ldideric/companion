# Beveiliging

Companion en Companion Login werken met je Canvas-sessie. Een lek daarin kan iemand toegang geven tot je Canvas, dus meld het niet in een openbare issue.

## Een probleem melden

Gebruik **Report a vulnerability** onder het tabblad [Security](https://github.com/ldideric/companion/security) van deze repository. Alleen de maker ziet je melding. Zet erin wat je zag, hoe je het kunt nadoen en welke versie je gebruikt (te zien in Instellingen, en voor Companion Login in `login/package.json`).

Je krijgt binnen een week antwoord. Een oplossing komt in een nieuwe versie, en in de release notes staat dat er een beveiligingsprobleem is opgelost. Wil je genoemd worden, zeg dat dan in je melding.

## Waar het over gaat

- **Companion** (de Docker-image `ghcr.io/ldideric/portflow-companion`): bijvoorbeeld een manier waarop een andere website of een ander apparaat je cookies of portfolio kan lezen, of iets in Portflow kan veranderen.
- **Companion Login** (`login/`): bijvoorbeeld een manier waarop je sessie ergens anders heen gaat dan Companion op je eigen computer.

Problemen in Canvas of Portflow zelf meld je bij Hogeschool Utrecht of Drieam, niet hier.

## In English

Please don't open a public issue for a security problem. Use **Report a vulnerability** under this repository's Security tab instead; only the maintainer sees it. You'll get a reply within a week.
