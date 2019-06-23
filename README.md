# Quoi :
Cette solution permet de chercher les informations d'un établissement (une entreprise, un artisan ou une association) française, à partir d'un nom et d'un département.

# Comment :
Cette solution fait des appels aux API de [data.gouv.fr](https://www.data.gouv.fr/fr/) :
 - [Sirene](https://entreprise.data.gouv.fr/api_doc_sirene) (système informatisé du répertoire national des entreprises et des établissements) 
 - [Rna](https://entreprise.data.gouv.fr/api_doc_rna) (Répertoire National des Associations).
  
Le service est côté client permettant ainsi d'utiliser l'IP du client et non celle du serveur évitant ainsi de se faire banir par les APIs.  
  

A partir du nom de l'entreprise, le but est d'afficher moins de `MAX_RESULTS_TO_SHOW` (10) résultats à l'utilisateur.  
Si il y a plus de `MAX_RESULTS_TO_SHOW` on demande le département à l'utilisateur pour réduire cette liste.  

Dans le cas où, les appel d'API renverrait trop de résultats `MAX_RESULTS_TO_COMPUTE` (500) nous indiquons à l'utilisateur que sa recherche engendre trop de résultat pour les afficher.

# Démonstration
[Démonstration](https://intia.github.io/searchFrenchSIRET)


# Comment démarrer

npm install  
npm start  
  
Puis ouvrir le navigateur sur http://localhost:8080
