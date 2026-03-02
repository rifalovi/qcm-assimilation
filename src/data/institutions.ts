import { makeQuestion, Question } from "./types";

export const INSTITUTIONS_L1: Question[] = [
  makeQuestion("i1-001",1,"Institutions","Qui vote les lois en France ?",
    "Le Président de la République","Le Gouvernement","Le Parlement","Le Conseil constitutionnel","C",
    "Les lois sont votées par le Parlement : Assemblée nationale et Sénat."
  ),
  makeQuestion("i1-002",1,"Institutions","Le Parlement est composé de :",
    "L’Assemblée nationale et le Sénat","Le Gouvernement et le Sénat","Le Président et le Premier ministre","Le Conseil d’État et la Cour de cassation","A",
    "Le Parlement comprend deux chambres : Assemblée nationale + Sénat."
  ),
  makeQuestion("i1-003",1,"Institutions","Le Président de la République est élu pour :",
    "3 ans","5 ans","7 ans","10 ans","B",
    "Depuis 2000, le mandat présidentiel est de 5 ans (quinquennat)."
  ),
  makeQuestion("i1-004",1,"Institutions","Le Premier ministre :",
    "Dirige le Gouvernement","Dirige l’Assemblée nationale","Dirige le Conseil constitutionnel","Dirige les mairies","A",
    "Le Premier ministre dirige l’action du Gouvernement."
  ),
  makeQuestion("i1-005",1,"Institutions","Le maire est élu par :",
    "Le Président","Les conseillers municipaux","Le préfet","Un tirage au sort","B",
    "Après les élections municipales, les conseillers municipaux élisent le maire."
  ),
  makeQuestion("i1-006",1,"Institutions","Le préfet représente :",
    "Le Gouvernement dans le département/région","Le Sénat","La commune","Un parti politique","A",
    "Le préfet est le représentant de l’État dans le département (et souvent la région)."
  ),
  makeQuestion("i1-007",1,"Institutions","La commune est dirigée par :",
    "Le maire","Le député","Le préfet","Le juge","A",
    "La commune est une collectivité territoriale dirigée par un maire et un conseil municipal."
  ),
  makeQuestion("i1-008",1,"Institutions","À quoi sert le Conseil constitutionnel ?",
    "Voter les lois","Contrôler la constitutionnalité des lois","Diriger la police","Nommer les maires","B",
    "Le Conseil constitutionnel vérifie que les lois respectent la Constitution."
  ),
  makeQuestion("i1-009",1,"Institutions","Les élections municipales servent à élire :",
    "Le Président","Les conseillers municipaux","Les sénateurs","Les préfets","B",
    "On élit d’abord les conseillers municipaux ; ensuite, ils élisent le maire."
  ),
  makeQuestion("i1-010",1,"Institutions","Le Sénat représente principalement :",
    "Les entreprises","Les collectivités territoriales","Les ministères","Les syndicats","B",
    "Le Sénat représente les collectivités territoriales."
  ),
  makeQuestion("i1-011",1,"Institutions","Le siège du Gouvernement est à :",
    "Marseille","Paris","Lyon","Strasbourg","B",
    "Le Gouvernement siège à Paris."
  ),
  makeQuestion("i1-012",1,"Institutions","Le siège du Parlement européen est à :",
    "Strasbourg","Nice","Toulouse","Lille","A",
    "Le Parlement européen tient notamment ses sessions plénières à Strasbourg."
  ),
  makeQuestion("i1-013",1,"Institutions","La justice en France est rendue au nom :",
    "Du Président","Du peuple français","Du Premier ministre","Du Parlement","B",
    "La justice est rendue au nom du peuple français."
  ),
  makeQuestion("i1-014",1,"Institutions","Quel document fixe les règles fondamentales de la République ?",
    "La Constitution","Le règlement intérieur","Le code de la route","Un décret municipal","A",
    "La Constitution est la norme suprême de l’organisation politique."
  ),
  makeQuestion("i1-015",1,"Institutions","Les députés siègent à :",
    "L’Assemblée nationale","Le Sénat","Le Conseil constitutionnel","La mairie","A",
    "Les députés siègent à l’Assemblée nationale."
  ),
  makeQuestion("i1-016",1,"Institutions","Les sénateurs siègent au :",
    "Conseil d’État","Sénat","Conseil constitutionnel","Conseil régional","B",
    "Les sénateurs siègent au Sénat."
  ),
  makeQuestion("i1-017",1,"Institutions","Le Président de la République nomme :",
    "Le Premier ministre","Les maires","Les préfets uniquement","Les députés","A",
    "Le Président nomme le Premier ministre (et, sur proposition, les ministres)."
  ),
  makeQuestion("i1-018",1,"Institutions","Une loi est proposée par :",
    "Le Parlement ou le Gouvernement","Uniquement le Président","Uniquement les préfets","Uniquement les maires","A",
    "Initiative des lois : projets (Gouvernement) et propositions (parlementaires)."
  ),
  makeQuestion("i1-019",1,"Institutions","Une région est une :",
    "Collectivité territoriale","Entreprise publique","Association","Société privée","A",
    "La région est une collectivité territoriale avec un conseil régional."
  ),
  makeQuestion("i1-020",1,"Institutions","Le Conseil d’État est surtout :",
    "Une juridiction administrative et conseiller du Gouvernement","Une chambre du Parlement","Une mairie","Un tribunal pénal","A",
    "Le Conseil d’État est la plus haute juridiction administrative et conseille aussi le Gouvernement."
  ),
];
export const INSTITUTIONS_L2: Question[] = [
  makeQuestion("i2-001",2,"Institutions","Qui promulgue les lois une fois votées ?",
    "Le Président de la République","Le maire","Le Conseil constitutionnel","Le préfet","A",
    "Une fois votée et éventuellement contrôlée, la loi est promulguée par le Président de la République."
  ),
  makeQuestion("i2-002",2,"Institutions","Quel est le rôle principal de l’Assemblée nationale ?",
    "Voter la loi et contrôler le Gouvernement","Nommer les maires","Contrôler les frontières","Rendre la justice","A",
    "L’Assemblée nationale vote la loi et contrôle l’action du Gouvernement."
  ),
  makeQuestion("i2-003",2,"Institutions","Le Sénat est élu principalement par :",
    "Les citoyens au suffrage universel direct","Les grands électeurs","Le Président","Les préfets","B",
    "Les sénateurs sont élus au suffrage indirect par des grands électeurs (élus locaux)."
  ),
  makeQuestion("i2-004",2,"Institutions","Le Gouvernement est composé :",
    "Du Président uniquement","Du Premier ministre et des ministres","Des députés","Des juges","B",
    "Le Gouvernement regroupe le Premier ministre et les ministres."
  ),
  makeQuestion("i2-005",2,"Institutions","Le Conseil constitutionnel peut :",
    "Annuler une loi contraire à la Constitution","Créer une loi","Condamner pénalement","Élire le Président","A",
    "Il contrôle la constitutionnalité : une loi non conforme ne peut pas être appliquée."
  ),
  makeQuestion("i2-006",2,"Institutions","Une commune est une collectivité :",
    "Dirigée par un conseil municipal","Dirigée par le Sénat","Dirigée par un préfet élu","Dirigée par le Président","A",
    "La commune est gérée par un conseil municipal et un maire."
  ),
  makeQuestion("i2-007",2,"Institutions","Le Président de la République est élu :",
    "Par les députés","Au suffrage universel direct","Par le Sénat","Par les maires","B",
    "Le Président est élu par les citoyens (suffrage universel direct)."
  ),
  makeQuestion("i2-008",2,"Institutions","Quel est le rôle du Premier ministre ?",
    "Diriger l’action du Gouvernement","Voter les lois","Diriger le Sénat","Diriger les régions","A",
    "Le Premier ministre dirige l’action du Gouvernement."
  ),
  makeQuestion("i2-009",2,"Institutions","Le Conseil d’État est la plus haute juridiction :",
    "Pénale","Administrative","Commerciale","Constitutionnelle","B",
    "Le Conseil d’État est la plus haute juridiction administrative."
  ),
  makeQuestion("i2-010",2,"Institutions","La Cour de cassation est la plus haute juridiction :",
    "Administrative","Judiciaire","Européenne","Municipale","B",
    "La Cour de cassation est la plus haute juridiction de l’ordre judiciaire."
  ),
  makeQuestion("i2-011",2,"Institutions","Le préfet est nommé par :",
    "Le maire","Le Gouvernement","Les citoyens","Le Sénat","B",
    "Le préfet est un haut fonctionnaire nommé par le Gouvernement."
  ),
  makeQuestion("i2-012",2,"Institutions","Les régions gèrent notamment :",
    "Les écoles maternelles","Les lycées et les transports régionaux (exemples)","La défense nationale","La justice","B",
    "Les régions ont des compétences comme les lycées, transports, développement économique (selon cadre)."
  ),
  makeQuestion("i2-013",2,"Institutions","Les départements gèrent notamment :",
    "Les collèges et l’action sociale (exemples)","Les universités","La politique étrangère","La monnaie","A",
    "Le département intervient souvent sur collèges, routes départementales, action sociale."
  ),
  makeQuestion("i2-014",2,"Institutions","Les communes gèrent notamment :",
    "La monnaie","L’état civil et des services de proximité","La défense","Les frontières","B",
    "La commune gère l’état civil (naissance, mariage) et des services locaux."
  ),
  makeQuestion("i2-015",2,"Institutions","La justice en France est :",
    "Indépendante","Dirigée par les maires","Soumise aux entreprises","Inexistante","A",
    "Le principe d’indépendance de la justice est fondamental dans l’État de droit."
  ),
  makeQuestion("i2-016",2,"Institutions","Une motion de censure vise à :",
    "Renverser le Gouvernement","Élire le Président","Annuler une élection municipale","Nommer un préfet","A",
    "La motion de censure est un outil parlementaire contre le Gouvernement."
  ),
  makeQuestion("i2-017",2,"Institutions","Le Parlement européen représente :",
    "Uniquement la France","Les citoyens de l’Union européenne","Les maires européens","Les préfets","B",
    "Le Parlement européen représente les citoyens de l’UE."
  ),
  makeQuestion("i2-018",2,"Institutions","Le Conseil municipal est élu par :",
    "Le préfet","Les citoyens (élections municipales)","Le Président","Le Sénat","B",
    "Les conseillers municipaux sont élus par les citoyens lors des municipales."
  ),
  makeQuestion("i2-019",2,"Institutions","La Constitution actuelle (Vᵉ République) date de :",
    "1905","1958","1789","2002","B",
    "La Constitution de 1958 fonde la Vᵉ République."
  ),
  makeQuestion("i2-020",2,"Institutions","Le Conseil constitutionnel peut être saisi pour :",
    "Contrôler une loi avant sa promulgation (selon procédure)","Créer un ministère","Élire le Sénat","Nommer un maire","A",
    "Il peut contrôler une loi avant promulgation selon les procédures prévues."
  ),
];
export const INSTITUTIONS_L3: Question[] = [
  makeQuestion("i3-001",3,"Institutions","Le Président de la République est élu pour :",
    "4 ans","5 ans","6 ans","7 ans","B",
    "Mandat présidentiel : 5 ans. Piège : confondre avec ancien septennat. Source : Livret, p.9-10."
  ),
  makeQuestion("i3-002",3,"Institutions","Le Président nomme :",
    "Le Président du Sénat","Le Premier ministre","Le maire","Les députés","B",
    "Le Président nomme le Premier ministre. Piège : confondre nomination et élection. Source : Livret, p.9-10."
  ),
  makeQuestion("i3-003",3,"Institutions","Le Parlement est composé de :",
    "Conseil constitutionnel + Conseil d’État","Assemblée nationale + Sénat","Président + Gouvernement","Régions + Départements","B",
    "Parlement = Assemblée nationale + Sénat. Source : Livret, p.9."
  ),
  makeQuestion("i3-004",3,"Institutions","Les députés sont élus pour :",
    "4 ans","5 ans","6 ans","9 ans","B",
    "Députés : 5 ans. Piège : confondre avec sénateurs (6). Source : Livret, p.9."
  ),
  makeQuestion("i3-005",3,"Institutions","Les sénateurs sont élus :",
    "Au suffrage universel direct","Au suffrage universel indirect","Par le Président","Par tirage au sort","B",
    "Sénateurs : suffrage indirect. Piège : croire que tout est direct. Source : Livret, p.9."
  ),
  makeQuestion("i3-006",3,"Institutions","Le mandat des sénateurs est de :",
    "5 ans","6 ans","7 ans","10 ans","B",
    "Mandat : 6 ans. Source : Livret, p.9."
  ),
  makeQuestion("i3-007",3,"Institutions","Le Parlement a notamment pour rôle de :",
    "Voter les lois et contrôler le Gouvernement","Rendre la justice","Nommer les maires","Diriger les régions","A",
    "Vote de la loi + contrôle du Gouvernement. Source : Livret, p.9."
  ),
  makeQuestion("i3-008",3,"Institutions","La Constitution actuelle (Ve République) a été adoptée en :",
    "1789","1875","1958","1992","C",
    "Constitution de 1958. Piège : 1875 = IIIe République. Source : Livret, p.9-16."
  ),
  makeQuestion("i3-009",3,"Institutions","La séparation des pouvoirs concerne :",
    "Exécutif, législatif et autorité judiciaire","Police et gendarmerie","Commune et région","École et religion","A",
    "Séparation : exécutif / législatif / autorité judiciaire. Piège : confondre avec laïcité. Source : Livret, p.9."
  ),
  makeQuestion("i3-010",3,"Institutions","Au niveau local, les trois collectivités principales sont :",
    "Commune, département, région","Commune, canton, préfecture","Région, État, UE","Sénat, Assemblée, Conseil d’État","A",
    "Collectivités : commune, département, région. Piège : ‘préfecture’ (c’est l’État). Source : Livret, p.11."
  ),

  makeQuestion("i3-011",3,"Institutions","La France compte (au 1er janvier 2021) environ :",
    "9 000 communes","15 000 communes","34 965 communes","101 communes","C",
    "Le livret cite 34 965 communes. Piège : confondre avec départements. Source : Livret, p.11."
  ),
  makeQuestion("i3-012",3,"Institutions","Les communes sont notamment responsables :",
    "Des lycées","Des écoles maternelles et primaires, et de l’état civil","Des collèges","Des universités","B",
    "Commune : écoles maternelles/primaires + état civil. Piège : collèges/lycées. Source : Livret, p.11."
  ),
  makeQuestion("i3-013",3,"Institutions","Les départements sont notamment responsables :",
    "Des transports publics régionaux","Des collèges et de la protection de l’enfance","Des écoles maternelles","De la monnaie","B",
    "Département : collèges + aide sociale/protection de l’enfance. Piège : transports = région. Source : Livret, p.11."
  ),
  makeQuestion("i3-014",3,"Institutions","Les régions sont notamment chargées :",
    "De construire et entretenir les lycées","De tenir l’état civil","De voter les lois","De rendre la justice","A",
    "Région : lycées, transports, développement. Piège : état civil = commune. Source : Livret, p.11."
  ),
  makeQuestion("i3-015",3,"Institutions","La France compte :",
    "96 départements","100 départements","101 départements","110 départements","C",
    "Le livret cite 101 départements (métropole + outre-mer). Piège : 96 (métropole seule). Source : Livret, p.11."
  ),
  makeQuestion("i3-016",3,"Institutions","L’État est représenté dans les départements et régions par :",
    "Les maires","Les préfets (ou hauts-commissaires dans certaines collectivités d’outre-mer)","Les sénateurs","Les présidents de région","B",
    "Représentant de l’État : préfet. Piège : confondre élu local et représentant de l’État. Source : Livret, p.11."
  ),
  makeQuestion("i3-017",3,"Institutions","Les conseillers municipaux, départementaux et régionaux sont élus pour :",
    "4 ans","5 ans","6 ans","7 ans","C",
    "Mandats locaux : 6 ans (selon schéma du livret). Piège : 5 ans (président/députés). Source : Livret, p.10."
  ),
  makeQuestion("i3-018",3,"Institutions","La justice, selon le livret, sert notamment à :",
    "Voter des lois","Sanctionner les infractions et régler les litiges","Organiser les élections","Nommer les sénateurs","B",
    "Justice : litiges + sanctions. Piège : confondre avec rôle du Parlement. Source : Livret, p.9."
  ),
  makeQuestion("i3-019",3,"Institutions","La France est un État de droit : cela signifie que :",
    "Le pouvoir politique est soumis à la loi (Constitution + lois)","Le Président peut décider sans contrôle","La justice dépend du Gouvernement","Les lois diffèrent selon l’origine","A",
    "État de droit : pouvoir soumis à la loi, garanties, égalité devant la loi. Piège : imaginer un pouvoir sans limites. Source : Livret, p.9."
  ),
  makeQuestion("i3-020",3,"Institutions","Le suffrage universel signifie que peuvent voter :",
    "Uniquement les hommes","Tous les citoyens de 18 ans disposant de leurs droits civils et politiques","Toute personne résidant en France","Les personnes mariées uniquement","B",
    "Vote : citoyens, 18 ans, droits civils et politiques. Piège : confondre citoyen et résident. Source : Livret, p.4 et p.8."
  ),
];