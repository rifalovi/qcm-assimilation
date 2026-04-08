-- =============================================================================
-- audio_episodes_seed.sql — seed des 80 épisodes depuis src/data/audioEpisodes.ts
-- Idempotent : ON CONFLICT (episode_slug) DO NOTHING.
--
-- Les is_free sont définis pour les épisodes 1 et 2 de chaque série (cohérent
-- avec FREE_EPISODE_NUMBERS dans le code). position = episode_number.
-- Les 70 épisodes présents dans audio_content/episodes.json incluent leur prompt,
-- les 10 épisodes "pourquoi_francais" n'ont pas de prompt (null).
-- =============================================================================

insert into public.audio_episodes
  (series_id, episode_slug, episode_number, episode_title,
   duration_target_seconds, premium, is_free, position, prompt)
select s.id, v.episode_slug, v.episode_number, v.episode_title,
       v.duration_target_seconds, v.premium, v.is_free, v.position, v.prompt
from public.audio_series s
join (values
  ('valeurs_republique', 'la-devise-liberte-egalite-fraternite', 1, 'La devise : Liberté, Égalité, Fraternité', 90, true, true, 1, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Valeurs de la République
- Titre de l’épisode : La devise : Liberté, Égalité, Fraternité
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
$prompt$),
  ('valeurs_republique', 'les-libertes-fondamentales-en-france-expression-conscience-religion', 2, 'Les libertés fondamentales en France (expression, conscience, religion)', 90, true, true, 2, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Valeurs de la République
- Titre de l’épisode : Les libertés fondamentales en France (expression, conscience, religion)
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
$prompt$),
  ('valeurs_republique', 'les-limites-de-la-liberte-respect-loi-discrimination', 3, 'Les limites de la liberté (respect, loi, discrimination)', 90, true, false, 3, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Valeurs de la République
- Titre de l’épisode : Les limites de la liberté (respect, loi, discrimination)
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
$prompt$),
  ('valeurs_republique', 'legalite-et-la-non-discrimination', 4, 'L''égalité et la non-discrimination', 90, true, false, 4, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Valeurs de la République
- Titre de l’épisode : L’égalité et la non-discrimination
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
$prompt$),
  ('valeurs_republique', 'la-fraternite-et-la-solidarite', 5, 'La fraternité et la solidarité', 90, true, false, 5, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Valeurs de la République
- Titre de l’épisode : La fraternité et la solidarité
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
$prompt$),
  ('valeurs_republique', 'les-symboles-de-la-republique-francaise', 6, 'Les symboles de la République française', 90, true, false, 6, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Valeurs de la République
- Titre de l’épisode : Les symboles de la République française
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
$prompt$),
  ('valeurs_republique', 'la-langue-francaise-et-son-role-dans-la-republique', 7, 'La langue française et son rôle dans la République', 90, true, false, 7, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Valeurs de la République
- Titre de l’épisode : La langue française et son rôle dans la République
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
$prompt$),
  ('valeurs_republique', 'lhymne-national-et-les-traditions-republicaines', 8, 'L''hymne national et les traditions républicaines', 90, true, false, 8, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Valeurs de la République
- Titre de l’épisode : L’hymne national et les traditions républicaines
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
$prompt$),
  ('valeurs_republique', 'la-constitution-et-les-principes-fondamentaux-de-la-republique', 9, 'La Constitution et les principes fondamentaux de la République', 90, true, false, 9, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Valeurs de la République
- Titre de l’épisode : La Constitution et les principes fondamentaux de la République
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
$prompt$),
  ('valeurs_republique', 'lengagement-citoyen-et-le-role-des-associations', 10, 'L''engagement citoyen et le rôle des associations', 90, true, false, 10, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Valeurs de la République
- Titre de l’épisode : L’engagement citoyen et le rôle des associations
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
$prompt$),
  ('droits_devoirs_citoyen', 'les-droits-fondamentaux-en-france', 1, 'Les droits fondamentaux en France', 90, true, true, 1, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Droits et devoirs du citoyen
- Titre de l’épisode : Les droits fondamentaux en France
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
$prompt$),
  ('droits_devoirs_citoyen', 'la-declaration-des-droits-de-lhomme-et-du-citoyen', 2, 'La Déclaration des droits de l''homme et du citoyen', 90, true, true, 2, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Droits et devoirs du citoyen
- Titre de l’épisode : La Déclaration des droits de l’homme et du citoyen
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
$prompt$),
  ('droits_devoirs_citoyen', 'la-liberte-dexpression-et-ses-limites-juridiques', 3, 'La liberté d''expression et ses limites juridiques', 90, true, false, 3, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Droits et devoirs du citoyen
- Titre de l’épisode : La liberté d’expression et ses limites juridiques
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
$prompt$),
  ('droits_devoirs_citoyen', 'la-liberte-de-conscience-et-le-droit-de-ne-pas-croire', 4, 'La liberté de conscience et le droit de ne pas croire', 90, true, false, 4, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Droits et devoirs du citoyen
- Titre de l’épisode : La liberté de conscience et le droit de ne pas croire
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
$prompt$),
  ('droits_devoirs_citoyen', 'les-devoirs-du-citoyen-respecter-la-loi', 5, 'Les devoirs du citoyen : respecter la loi', 90, true, false, 5, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Droits et devoirs du citoyen
- Titre de l’épisode : Les devoirs du citoyen : respecter la loi
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
$prompt$),
  ('droits_devoirs_citoyen', 'les-sanctions-et-le-role-de-la-justice', 6, 'Les sanctions et le rôle de la justice', 90, true, false, 6, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Droits et devoirs du citoyen
- Titre de l’épisode : Les sanctions et le rôle de la justice
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
$prompt$),
  ('droits_devoirs_citoyen', 'legalite-devant-la-loi', 7, 'L''égalité devant la loi', 90, true, false, 7, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Droits et devoirs du citoyen
- Titre de l’épisode : L’égalité devant la loi
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
$prompt$),
  ('droits_devoirs_citoyen', 'les-droits-des-femmes-et-legalite-hommes-femmes', 8, 'Les droits des femmes et l''égalité hommes-femmes', 90, true, false, 8, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Droits et devoirs du citoyen
- Titre de l’épisode : Les droits des femmes et l’égalité hommes-femmes
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
$prompt$),
  ('droits_devoirs_citoyen', 'les-responsabilites-environnementales-du-citoyen', 9, 'Les responsabilités environnementales du citoyen', 90, true, false, 9, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Droits et devoirs du citoyen
- Titre de l’épisode : Les responsabilités environnementales du citoyen
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
$prompt$),
  ('droits_devoirs_citoyen', 'la-securite-et-le-role-de-la-police-et-de-la-gendarmerie', 10, 'La sécurité et le rôle de la police et de la gendarmerie', 90, true, false, 10, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Valeurs
- Sous-thème : Droits et devoirs du citoyen
- Titre de l’épisode : La sécurité et le rôle de la police et de la gendarmerie
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
$prompt$),
  ('institutions', 'la-separation-des-pouvoirs-executif-legislatif-judiciaire', 1, 'La séparation des pouvoirs : exécutif, législatif, judiciaire', 90, true, true, 1, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Institutions
- Sous-thème : Institutions
- Titre de l’épisode : La séparation des pouvoirs : exécutif, législatif, judiciaire
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
$prompt$),
  ('institutions', 'le-president-de-la-republique-role-et-election', 2, 'Le Président de la République : rôle et élection', 90, true, true, 2, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Institutions
- Sous-thème : Institutions
- Titre de l’épisode : Le Président de la République : rôle et élection
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
$prompt$),
  ('institutions', 'le-gouvernement-et-le-premier-ministre', 3, 'Le gouvernement et le Premier ministre', 90, true, false, 3, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Institutions
- Sous-thème : Institutions
- Titre de l’épisode : Le gouvernement et le Premier ministre
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
$prompt$),
  ('institutions', 'le-parlement-assemblee-nationale-et-senat', 4, 'Le Parlement : Assemblée nationale et Sénat', 90, true, false, 4, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Institutions
- Sous-thème : Institutions
- Titre de l’épisode : Le Parlement : Assemblée nationale et Sénat
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
$prompt$),
  ('institutions', 'le-role-des-deputes-et-des-senateurs', 5, 'Le rôle des députés et des sénateurs', 90, true, false, 5, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Institutions
- Sous-thème : Institutions
- Titre de l’épisode : Le rôle des députés et des sénateurs
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
$prompt$),
  ('institutions', 'les-elections-en-france-types-et-fonctionnement', 6, 'Les élections en France : types et fonctionnement', 90, true, false, 6, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Institutions
- Sous-thème : Institutions
- Titre de l’épisode : Les élections en France : types et fonctionnement
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
$prompt$),
  ('institutions', 'le-droit-de-vote-et-le-suffrage-universel', 7, 'Le droit de vote et le suffrage universel', 90, true, false, 7, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Institutions
- Sous-thème : Institutions
- Titre de l’épisode : Le droit de vote et le suffrage universel
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
$prompt$),
  ('institutions', 'les-collectivites-territoriales-commune-departement-region', 8, 'Les collectivités territoriales : commune, département, région', 90, true, false, 8, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Institutions
- Sous-thème : Institutions
- Titre de l’épisode : Les collectivités territoriales : commune, département, région
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
$prompt$),
  ('institutions', 'le-role-du-prefet-et-de-letat-local', 9, 'Le rôle du préfet et de l''État local', 90, true, false, 9, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Institutions
- Sous-thème : Institutions
- Titre de l’épisode : Le rôle du préfet et de l’État local
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
$prompt$),
  ('institutions', 'lunion-europeenne-et-la-place-de-la-france', 10, 'L''Union européenne et la place de la France', 90, true, false, 10, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Institutions
- Sous-thème : Institutions
- Titre de l’épisode : L’Union européenne et la place de la France
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
$prompt$),
  ('histoire_geographie', 'la-revolution-francaise-et-ses-principes', 1, 'La Révolution française et ses principes', 90, true, true, 1, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Histoire et géographie
- Sous-thème : Histoire et géographie
- Titre de l’épisode : La Révolution française et ses principes
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
$prompt$),
  ('histoire_geographie', 'napoleon-et-la-construction-de-letat', 2, 'Napoléon et la construction de l''État', 90, true, true, 2, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Histoire et géographie
- Sous-thème : Histoire et géographie
- Titre de l’épisode : Napoléon et la construction de l’État
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
$prompt$),
  ('histoire_geographie', 'les-grandes-guerres-mondiales', 3, 'Les grandes guerres mondiales', 90, true, false, 3, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Histoire et géographie
- Sous-thème : Histoire et géographie
- Titre de l’épisode : Les grandes guerres mondiales
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
$prompt$),
  ('histoire_geographie', 'la-naissance-de-la-ve-republique-1958', 4, 'La naissance de la Ve République (1958)', 90, true, false, 4, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Histoire et géographie
- Sous-thème : Histoire et géographie
- Titre de l’épisode : La naissance de la Ve République (1958)
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
$prompt$),
  ('histoire_geographie', 'les-grandes-dates-nationales-14-juillet-11-novembre', 5, 'Les grandes dates nationales (14 juillet, 11 novembre)', 90, true, false, 5, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Histoire et géographie
- Sous-thème : Histoire et géographie
- Titre de l’épisode : Les grandes dates nationales (14 juillet, 11 novembre)
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
$prompt$),
  ('histoire_geographie', 'labolition-de-lesclavage-en-france', 6, 'L''abolition de l''esclavage en France', 90, true, false, 6, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Histoire et géographie
- Sous-thème : Histoire et géographie
- Titre de l’épisode : L’abolition de l’esclavage en France
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
$prompt$),
  ('histoire_geographie', 'lecole-republicaine-jules-ferry', 7, 'L''école républicaine (Jules Ferry)', 90, true, false, 7, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Histoire et géographie
- Sous-thème : Histoire et géographie
- Titre de l’épisode : L’école républicaine (Jules Ferry)
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
$prompt$),
  ('histoire_geographie', 'la-geographie-de-la-france-territoires-et-regions', 8, 'La géographie de la France (territoires et régions)', 90, true, false, 8, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Histoire et géographie
- Sous-thème : Histoire et géographie
- Titre de l’épisode : La géographie de la France (territoires et régions)
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
$prompt$),
  ('histoire_geographie', 'les-grandes-villes-et-espaces-francais', 9, 'Les grandes villes et espaces français', 90, true, false, 9, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Histoire et géographie
- Sous-thème : Histoire et géographie
- Titre de l’épisode : Les grandes villes et espaces français
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
$prompt$),
  ('histoire_geographie', 'la-culture-francaise-ecrivains-artistes-patrimoine', 10, 'La culture française (écrivains, artistes, patrimoine)', 90, true, false, 10, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Histoire et géographie
- Sous-thème : Histoire et géographie
- Titre de l’épisode : La culture française (écrivains, artistes, patrimoine)
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
$prompt$),
  ('societe', 'les-numeros-durgence-et-les-services-publics', 1, 'Les numéros d''urgence et les services publics', 90, true, true, 1, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Société
- Sous-thème : Vivre dans la société française
- Titre de l’épisode : Les numéros d’urgence et les services publics
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
$prompt$),
  ('societe', 'le-systeme-de-sante-en-france', 2, 'Le système de santé en France', 90, true, true, 2, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Société
- Sous-thème : Vivre dans la société française
- Titre de l’épisode : Le système de santé en France
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
$prompt$),
  ('societe', 'la-securite-sociale-et-la-carte-vitale', 3, 'La sécurité sociale et la carte Vitale', 90, true, false, 3, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Société
- Sous-thème : Vivre dans la société française
- Titre de l’épisode : La sécurité sociale et la carte Vitale
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
$prompt$),
  ('societe', 'le-travail-en-france-smic-droits-et-obligations', 4, 'Le travail en France (SMIC, droits et obligations)', 90, true, false, 4, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Société
- Sous-thème : Vivre dans la société française
- Titre de l’épisode : Le travail en France (SMIC, droits et obligations)
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
$prompt$),
  ('societe', 'chercher-un-emploi-en-france', 5, 'Chercher un emploi en France', 90, true, false, 5, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Société
- Sous-thème : Vivre dans la société française
- Titre de l’épisode : Chercher un emploi en France
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
$prompt$),
  ('societe', 'creer-une-entreprise-en-france', 6, 'Créer une entreprise en France', 90, true, false, 6, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Société
- Sous-thème : Vivre dans la société française
- Titre de l’épisode : Créer une entreprise en France
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
$prompt$),
  ('societe', 'lecole-et-leducation-obligatoire', 7, 'L''école et l''éducation obligatoire', 90, true, false, 7, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Société
- Sous-thème : Vivre dans la société française
- Titre de l’épisode : L’école et l’éducation obligatoire
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
$prompt$),
  ('societe', 'la-famille-et-le-droit-mariage-enfants-etat-civil', 8, 'La famille et le droit (mariage, enfants, état civil)', 90, true, false, 8, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Société
- Sous-thème : Vivre dans la société française
- Titre de l’épisode : La famille et le droit (mariage, enfants, état civil)
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
$prompt$),
  ('societe', 'les-demarches-administratives-essentielles', 9, 'Les démarches administratives essentielles', 90, true, false, 9, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Société
- Sous-thème : Vivre dans la société française
- Titre de l’épisode : Les démarches administratives essentielles
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
$prompt$),
  ('societe', 'vivre-ensemble-en-france-regles-et-comportements', 10, 'Vivre ensemble en France (règles et comportements)', 90, true, false, 10, $prompt$Tu es un expert en pédagogie civique française et en préparation à l’entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l’utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Société
- Sous-thème : Vivre dans la société française
- Titre de l’épisode : Vivre ensemble en France (règles et comportements)
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
$prompt$),
  ('pourquoi_francais', 'comprendre-ce-que-lagent-attend-vraiment', 1, 'Comprendre ce que l''agent attend vraiment', 90, true, true, 1, null::text),
  ('pourquoi_francais', 'construire-votre-reponse-personnelle-en-3-parties', 2, 'Construire votre réponse personnelle en 3 parties', 90, true, true, 2, null::text),
  ('pourquoi_francais', 'parler-de-votre-parcours-sans-trop-en-dire', 3, 'Parler de votre parcours sans trop en dire', 90, true, false, 3, null::text),
  ('pourquoi_francais', 'demontrer-votre-attachement-aux-valeurs-republicaines', 4, 'Démontrer votre attachement aux valeurs républicaines', 90, true, false, 4, null::text),
  ('pourquoi_francais', 'parler-de-votre-integration-dans-la-societe-francaise', 5, 'Parler de votre intégration dans la société française', 90, true, false, 5, null::text),
  ('pourquoi_francais', 'les-mots-qui-rassurent-vs-les-mots-qui-inquietent', 6, 'Les mots qui rassurent vs les mots qui inquiètent', 90, true, false, 6, null::text),
  ('pourquoi_francais', 'que-faire-si-vous-bloquez-ou-ne-savez-pas-quoi-dire', 7, 'Que faire si vous bloquez ou ne savez pas quoi dire', 90, true, false, 7, null::text),
  ('pourquoi_francais', 'religion-origines-culture-comment-en-parler-sans-se-pieger', 8, 'Religion, origines, culture : comment en parler sans se piéger', 90, true, false, 8, null::text),
  ('pourquoi_francais', 'repeter-et-incarner-sa-reponse-a-loral', 9, 'Répéter et incarner sa réponse à l''oral', 90, true, false, 9, null::text),
  ('pourquoi_francais', 'simulation-complete-la-question-une-reponse-modele-commentee', 10, 'Simulation complète : la question, une réponse modèle commentée', 90, true, false, 10, null::text),
  ('quiz_audio', 'connaissez-vous-un-ecrivain-ou-auteur-francais', 1, 'Connaissez-vous un écrivain ou auteur français ?', 90, true, true, 1, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Connaissez-vous un écrivain ou auteur français ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'avez-vous-deja-lu-un-livre-en-francais-lequel', 2, 'Avez-vous déjà lu un livre en français ? Lequel ?', 90, true, true, 2, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Avez-vous déjà lu un livre en français ? Lequel ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'quel-type-de-lecture-aimez-vous', 3, 'Quel type de lecture aimez-vous ?', 90, true, false, 3, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Quel type de lecture aimez-vous ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'une-oeuvre-ou-un-auteur-qui-vous-a-marque', 4, 'Pouvez-vous citer une œuvre ou un auteur qui vous a marqué ?', 90, true, false, 4, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Pouvez-vous citer une œuvre ou un auteur qui vous a marqué ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'etes-vous-deja-alle-au-theatre-en-france', 5, 'Êtes-vous déjà allé au théâtre en France ?', 90, true, false, 5, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Êtes-vous déjà allé au théâtre en France ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'avez-vous-visite-un-musee-lequel-vous-a-marque', 6, 'Avez-vous déjà visité un musée ? Lequel vous a le plus marqué ?', 90, true, false, 6, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Avez-vous déjà visité un musée ? Lequel vous a le plus marqué ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'connaissez-vous-un-artiste-ou-personnalite-culturelle-francaise', 7, 'Connaissez-vous un artiste ou une personnalité culturelle française ?', 90, true, false, 7, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Connaissez-vous un artiste ou une personnalité culturelle française ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'regardez-vous-des-films-ou-series-francais-lesquels', 8, 'Regardez-vous des films ou séries français ? Lesquels ?', 90, true, false, 8, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Regardez-vous des films ou séries français ? Lesquels ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'connaissez-vous-des-chansons-francaises-pouvez-vous-en-citer-une', 9, 'Connaissez-vous des chansons françaises ? Pouvez-vous en citer une ?', 90, true, false, 9, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Connaissez-vous des chansons françaises ? Pouvez-vous en citer une ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'savez-vous-ce-quest-la-marseillaise', 10, 'Savez-vous ce qu''est la Marseillaise ?', 90, true, false, 10, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Savez-vous ce qu'est la Marseillaise ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'avez-vous-voyage-en-france-quelles-villes-ou-regions', 11, 'Avez-vous voyagé en France ? Quelles villes ou régions avez-vous visitées ?', 90, true, false, 11, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Avez-vous voyagé en France ? Quelles villes ou régions avez-vous visitées ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'quelle-ville-francaise-aimez-vous-particulierement-et-pourquoi', 12, 'Quelle ville française aimez-vous particulièrement et pourquoi ?', 90, true, false, 12, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Quelle ville française aimez-vous particulièrement et pourquoi ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'qu-aimez-vous-dans-la-culture-francaise', 13, 'Qu''aimez-vous dans la culture française ?', 90, true, false, 13, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Qu'aimez-vous dans la culture française ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'qu-est-ce-qui-vous-a-surpris-en-arrivant-en-france', 14, 'Qu''est-ce qui vous a surpris en arrivant en France ?', 90, true, false, 14, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Qu'est-ce qui vous a surpris en arrivant en France ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'comment-vous-informez-vous-de-l-actualite-en-france', 15, 'Comment vous informez-vous de l''actualité en France ?', 90, true, false, 15, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Comment vous informez-vous de l'actualité en France ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'avez-vous-des-activites-ou-engagements-en-france', 16, 'Avez-vous des activités ou des engagements en France ?', 90, true, false, 16, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Avez-vous des activités ou des engagements en France ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'avez-vous-des-amis-francais-comment-vous-etes-vous-rencontres', 17, 'Avez-vous des amis français ? Comment vous êtes-vous rencontrés ?', 90, true, false, 17, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Avez-vous des amis français ? Comment vous êtes-vous rencontrés ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'que-faites-vous-pendant-votre-temps-libre-en-france', 18, 'Que faites-vous pendant votre temps libre en France ?', 90, true, false, 18, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Que faites-vous pendant votre temps libre en France ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'avez-vous-participe-a-un-evenement-ou-une-fete-en-france', 19, 'Avez-vous participé à un événement ou une fête en France ?', 90, true, false, 19, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Avez-vous participé à un événement ou une fête en France ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$),
  ('quiz_audio', 'qu-est-ce-que-vivre-en-france-a-change-pour-vous', 20, 'Qu''est-ce que vivre en France a changé pour vous ?', 90, true, false, 20, $prompt$Tu es un expert en pédagogie civique française et en préparation à l'entretien de naturalisation.

Ta mission est de créer un script audio immersif et réaliste simulant un entretien entre un agent de préfecture et un candidat.

Objectif :
Produire un contenu audio premium, clair, naturel et pédagogique, qui aide l'utilisateur à comprendre et mémoriser les notions essentielles.

CONTEXTE :
- Thème : Quiz Audio
- Sous-thème : Questions courantes d'intégration
- Titre de l'épisode : Qu'est-ce que vivre en France a changé pour vous ?
- Niveau : débutant à intermédiaire
- Durée cible : 1 à 2 minutes
- Langue : français
- Public : candidat étranger préparant un entretien ou un examen civique en France

FORMAT ATTENDU :
Le script doit suivre EXACTEMENT cette structure :
1. Introduction immersive (agent)
2. Question posée par l'agent
3. Pause
4. Réponse modèle du candidat
5. Explication pédagogique
6. Point d'attention
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
- Fais comme si l'utilisateur passait un vrai entretien
- Mets des phrases que l'utilisateur peut réutiliser à l'oral
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
$prompt$)
) as v(subtheme_key, episode_slug, episode_number, episode_title,
       duration_target_seconds, premium, is_free, position, prompt)
on s.subtheme_key = v.subtheme_key
on conflict (episode_slug) do nothing;
