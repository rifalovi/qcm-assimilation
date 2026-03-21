from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

OUTPUT_DIR = Path("audio_content")
TXT_DIR = OUTPUT_DIR / "prompts_txt"


AUDIO_PROGRAM: list[dict[str, Any]] = [
    {
        "theme_key": "Valeurs",
        "theme_label": "Valeurs",
        "subsections": [
            {
                "subtheme_key": "valeurs_republique",
                "subtheme_label": "Valeurs de la République",
                "episodes": [
                    "La devise : Liberté, Égalité, Fraternité",
                    "Les libertés fondamentales en France (expression, conscience, religion)",
                    "Les limites de la liberté (respect, loi, discrimination)",
                    "L’égalité et la non-discrimination",
                    "La fraternité et la solidarité",
                    "Les symboles de la République française",
                    "La langue française et son rôle dans la République",
                    "L’hymne national et les traditions républicaines",
                    "La Constitution et les principes fondamentaux de la République",
                    "L’engagement citoyen et le rôle des associations",
                ],
            },
            {
                "subtheme_key": "droits_devoirs_citoyen",
                "subtheme_label": "Droits et devoirs du citoyen",
                "episodes": [
                    "Les droits fondamentaux en France",
                    "La Déclaration des droits de l’homme et du citoyen",
                    "La liberté d’expression et ses limites juridiques",
                    "La liberté de conscience et le droit de ne pas croire",
                    "Les devoirs du citoyen : respecter la loi",
                    "Les sanctions et le rôle de la justice",
                    "L’égalité devant la loi",
                    "Les droits des femmes et l’égalité hommes-femmes",
                    "Les responsabilités environnementales du citoyen",
                    "La sécurité et le rôle de la police et de la gendarmerie",
                ],
            },
        ],
    },
    {
        "theme_key": "Institutions",
        "theme_label": "Institutions",
        "subsections": [
            {
                "subtheme_key": "institutions",
                "subtheme_label": "Institutions",
                "episodes": [
                    "La séparation des pouvoirs : exécutif, législatif, judiciaire",
                    "Le Président de la République : rôle et élection",
                    "Le gouvernement et le Premier ministre",
                    "Le Parlement : Assemblée nationale et Sénat",
                    "Le rôle des députés et des sénateurs",
                    "Les élections en France : types et fonctionnement",
                    "Le droit de vote et le suffrage universel",
                    "Les collectivités territoriales : commune, département, région",
                    "Le rôle du préfet et de l’État local",
                    "L’Union européenne et la place de la France",
                ],
            }
        ],
    },
    {
        "theme_key": "Histoire",
        "theme_label": "Histoire et géographie",
        "subsections": [
            {
                "subtheme_key": "histoire_geographie",
                "subtheme_label": "Histoire et géographie",
                "episodes": [
                    "La Révolution française et ses principes",
                    "Napoléon et la construction de l’État",
                    "Les grandes guerres mondiales",
                    "La naissance de la Ve République (1958)",
                    "Les grandes dates nationales (14 juillet, 11 novembre)",
                    "L’abolition de l’esclavage en France",
                    "L’école républicaine (Jules Ferry)",
                    "La géographie de la France (territoires et régions)",
                    "Les grandes villes et espaces français",
                    "La culture française (écrivains, artistes, patrimoine)",
                ],
            }
        ],
    },
    {
        "theme_key": "Société",
        "theme_label": "Société",
        "subsections": [
            {
                "subtheme_key": "societe",
                "subtheme_label": "Vivre dans la société française",
                "episodes": [
                    "Les numéros d’urgence et les services publics",
                    "Le système de santé en France",
                    "La sécurité sociale et la carte Vitale",
                    "Le travail en France (SMIC, droits et obligations)",
                    "Chercher un emploi en France",
                    "Créer une entreprise en France",
                    "L’école et l’éducation obligatoire",
                    "La famille et le droit (mariage, enfants, état civil)",
                    "Les démarches administratives essentielles",
                    "Vivre ensemble en France (règles et comportements)",
                ],
            }
        ],
    },
]


PROMPT_TEMPLATE = """Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : {theme_label}
- Sous-thème : {subtheme_label}
- Titre de l’épisode : {episode_title}
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l’agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d’attention
7. Conclusion courte à retenir

TON ET STYLE :
- Naturel et oral, comme une vraie conversation
- Simple, accessible, niveau A2-B1
- Phrases courtes
- Pas de jargon complexe
- Très clair pour un étranger
- Ton rassurant, précis, pédagogique

À ÉVITER :
- Texte trop long ou académique
- Répétitions inutiles
- Explications floues
- Ton robotique

BONNES PRATIQUES :
- Utilise des exemples concrets si possible
- Fais comme si l’utilisateur passait un vrai entretien
- Mets des phrases que l’utilisateur peut réutiliser à l’oral
- Fais apparaître les mots-clés importants naturellement
- Le contenu doit être exact, crédible et cohérent avec les valeurs et institutions françaises

FORMAT DE SORTIE :
Respecte STRICTEMENT ce format :

🎧 Épisode : [Titre]

👮 Agent :
[Texte]

❓ Question :
[Texte]

⏸️ Pause

👤 Candidat :
[Réponse]

📖 Explication :
[Texte]

⚠️ Attention :
[Texte]

✅ À retenir :
[Phrase courte]

Maintenant génère le script complet pour cet épisode.
"""


def slugify(text: str) -> str:
    text = text.lower().strip()
    replacements = {
        "à": "a",
        "â": "a",
        "ä": "a",
        "á": "a",
        "ç": "c",
        "é": "e",
        "è": "e",
        "ê": "e",
        "ë": "e",
        "î": "i",
        "ï": "i",
        "ì": "i",
        "í": "i",
        "ô": "o",
        "ö": "o",
        "ò": "o",
        "ó": "o",
        "ù": "u",
        "û": "u",
        "ü": "u",
        "ú": "u",
        "œ": "oe",
        "’": "",
        "'": "",
    }
    for src, dst in replacements.items():
        text = text.replace(src, dst)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return re.sub(r"-{2,}", "-", text).strip("-")


def build_episode_records() -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    global_index = 1

    for theme in AUDIO_PROGRAM:
        theme_key = theme["theme_key"]
        theme_label = theme["theme_label"]

        for subsection in theme["subsections"]:
            subtheme_key = subsection["subtheme_key"]
            subtheme_label = subsection["subtheme_label"]

            for idx, episode_title in enumerate(subsection["episodes"], start=1):
                episode_slug = slugify(episode_title)
                prompt = PROMPT_TEMPLATE.format(
                    theme_label=theme_label,
                    subtheme_label=subtheme_label,
                    episode_title=episode_title,
                )

                records.append(
                    {
                        "id": f"audio-{global_index:03d}",
                        "theme_key": theme_key,
                        "theme_label": theme_label,
                        "subtheme_key": subtheme_key,
                        "subtheme_label": subtheme_label,
                        "episode_number": idx,
                        "episode_title": episode_title,
                        "episode_slug": episode_slug,
                        "duration_target_seconds": 90,
                        "premium": True,
                        "prompt": prompt,
                    }
                )
                global_index += 1

    return records


def write_outputs(records: list[dict[str, Any]]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    TXT_DIR.mkdir(parents=True, exist_ok=True)

    episodes_json = OUTPUT_DIR / "episodes.json"
    prompts_md = OUTPUT_DIR / "prompts.md"

    episodes_json.write_text(
        json.dumps(records, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    md_parts: list[str] = ["# Prompts scripts audio\n"]
    for record in records:
        title = (
            f"{record['theme_label']} → {record['subtheme_label']} "
            f"→ Épisode {record['episode_number']} : {record['episode_title']}"
        )
        md_parts.append(f"\n## {title}\n")
        md_parts.append("```text\n")
        md_parts.append(record["prompt"])
        md_parts.append("\n```\n")

        txt_name = (
            f"{record['id']}_{record['theme_key']}_{record['subtheme_key']}_"
            f"{record['episode_number']:02d}_{record['episode_slug']}.txt"
        )
        (TXT_DIR / txt_name).write_text(record["prompt"], encoding="utf-8")

    prompts_md.write_text("".join(md_parts), encoding="utf-8")


def main() -> None:
    records = build_episode_records()
    write_outputs(records)
    print(f"{len(records)} épisodes générés.")
    print(f"JSON : {OUTPUT_DIR / 'episodes.json'}")
    print(f"Markdown : {OUTPUT_DIR / 'prompts.md'}")
    print(f"Prompts TXT : {TXT_DIR}")


if __name__ == "__main__":
    main()