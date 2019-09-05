angular.module('intia.services.rna', [])
  .factory('RnaSrv', ['$http', 'AsyncCallsSrv', 'StringSrv',
    ($http, AsyncCallsSrv, StringSrv) => {
      // The number of result per page wanted
      const PER_PAGE = 1000;

      // The maximum number of result to comput (Do not exceed 5 pages of results in its current state)
      const MAX_RESULTS_TO_COMPUTE = 5 * PER_PAGE; // should be a multiple of PER_PAGE

      // Constant that contains all the words that shouldn't be in the association's name while requesting the apis
      const BANNED_WORDS = ['ASSOCIATION'];

      /**
       * Format the given company's data
       *
       * @param {*} association The association choosen in the page
       * @return {};
       */
      const intiaFormatRna = (association) => (
        !association ? {} : {
          id: association.id,
          name1: association.titre,
          name2: association.titre_court,
          address: association.adresse_gestion_libelle_voie,
          city: association.adresse_libelle_commune,
          siret: association.siret,
          legal_form: association.libelle_nature_juridique_entreprise,
          naf: association.activite_principale,
          department: association.adresse_code_postal ? association.adresse_code_postal.substr(0, 2) : '',
          postal_code: association.adresse_code_postal,
          rna: association.id_association,
          creation_date: association.date_creation,
          phone: association.telephone,
          updateDate: association.updated_at,
          website: association.site_web,
          email: association.email,
          // nom_raison_sociale
          // search: l1_n + '\n' + l2_n + '\n' + l3_n + '\n' + l4_n + '\n' + l5_n + '\n' + l6_n,
          // address_declare: l1_d + '\n' + l2_d + '\n' + l3_d + '\n' + l4_d + '\n' + l5_d + '\n' + l6_d
        }
      );

      /**
       * Remove all special characters, accents and words considered as to be banned of the given associationName and return the new string formed
       * @param {*} associationName Name of the association seeked
       * @Returns associationNameTable
       */
      const formatAssociationName = (associationName) => {
        if (!associationName) {
          return '';
        }

        // We remove all special characters and accents of the upperCased associationName.
        // Then we keep words longer than 2 and not banned.
        return StringSrv
          .normalizeString(associationName.toUpperCase())
          .split(' ')
          .filter((word) => word.length > 1 && !BANNED_WORDS.includes(word))
          .join(' ');
      };

      /**
       * Check if the name of the searched association match the names of the association given
       * If a department is given, we check the value of the association's department as well
       *
       * @param {*} name The value used to filter the association object
       * @param {*} ent the association object
       * @param {*} association the association department, if given
       *
       * @returns isCandidate(Boolean)
       */
      const isAssociationCandidate = (name, association, department) => {
        if (!name || !association) {
          return false;
        }

        const candidateFields = [association.name1, association.name2];

        // We start by assuming that the association isn't candidate
        let isCandidate = false;

        // For each fields to compare the given value with

        // If a department value has been given and is equal to the association's value OR if no department has been given
        if ((department && association.department === department) || !department) {
          for (let i = 0; i < candidateFields.length; i += 1) {
            // We normalize the association field value in case of an api returning some non normalized characters in its result
            const normalizedFieldValue = formatAssociationName(candidateFields[i]);

            // If all words of the value variable are members of the normalizedFieldValue
            if (StringSrv.doAllWordsMatch(name, normalizedFieldValue)) {
              // We declare the association as being candidate
              isCandidate = true;

              // We stop the loop
              i = candidateFields.length;
            }
          }
        }

        return isCandidate;
      };

      /**
       * For each association in the Json:
       *
       * Call the intiaFormatRna() function to format the company's data
       *
       * Call the isAssociationCandidate() function to check if the company given
       * has in its name variables the name parameter
       *
       * Return a table of result containing all the fromated companiy corresponding to the
       *
       * @param {*} arr
       * @param {*} name
       */
      const filterAssociation = (arr, name, department) => {
        if (!arr || !name) {
          return null;
        }

        const upperName = name.toUpperCase();

        const filteredArr = [];

        // for each company of the first page
        arr.forEach((association) => {
          // We check if the company name really is similar to the association's
          const myassociation = intiaFormatRna(association);

          if (isAssociationCandidate(upperName, myassociation, department)) {
            // If it is, we push the company information into the associations result table
            filteredArr.push(myassociation);
          }
        });

        return filteredArr;
      };

      /**
       * Function that get each association of the results page
       * @param {*} pageRank
       */
      const getAllAssociations = (associationName, associationDepartment, pageRank, callback) => {
        if (!associationName) {
          callback('Error during server request');
          return;
        }

        const result = {
          tooMuchResults: false,
          resultsBeforeFiltering: 0,
          resultsTable: [],
        };

        const association = formatAssociationName(associationName);

        if (!association || association.length < 3) {
          callback('name not adapted');
        }

        // We create a new http request specifying the rank of the willed page
        const url = `https://entreprise.data.gouv.fr/api/rna/v1/full_text/${association}?per_page=${PER_PAGE}&page=${pageRank}&departement=${associationDepartment}`;

        $http.get(url)
          .success((data, status) => {
            // CHECK OF THE HTTP REQUEST'S VALIDITY
            if (status !== 200) {
              callback('Error during server request');
              return;
            }

            if (!data || !data.association) {
              callback(null, result);
              return;
            }

            // We count all the occurences of the Associations given existing in the json retrieved
            result.resultsBeforeFiltering = data.total_results;

            // If the number of results is greater than the limit of results wanted
            if (result.resultsBeforeFiltering > MAX_RESULTS_TO_COMPUTE) {
              // we send the "tooMuchvariable" variable to "true"
              result.tooMuchResults = true;
              callback(null, result);
              return;
            }

            const filteredArr = filterAssociation(data.association, association, associationDepartment);

            result.resultsTable = result.resultsTable.concat(filteredArr);

            callback(null, result);
          })

          .error((data, status) => {
            // When there is no result, we get back a 404 error
            if (status === 404) {
              callback(null, result);
              return;
            }

            callback('request error');
          });
      };

      const exports = {
        /**
         * getAssociations search associations from associationName AND associationDepartment
         * if founded associations greater than 500, THROW an ErrorTooManyResult
         * @param {*} associationName The name of the association
         * @param {*} associationDepartment The department of the association (can be empty)
         * @return [] :
         */
        getAssociations(associationName, associationDepartment, callback) {
          if (!associationName) {
            callback('No association name to search during Request');
          }

          // We declare the results object we will return to the association file
          const resultsToSend = {

            tooMuchResults: false,
            resultsBeforeFiltering: 0,
            resultsTable: [
              // {
              //     id: Number,
              //     name1: String,
              //     name2: String
              //     address: String,
              //     siret: Number,
              //     naf: String,
              //     department: Number,
              //     legal_form: String,
              //     rna: String,
              //
              // }
            ],
          };

          // WE GET THE FIRST PAGE OF RESULTS
          getAllAssociations(associationName, associationDepartment, 1, (err, result) => {
            if (!associationName) {
              callback('No association name to search during Request');
              return;
            }

            if (err) {
              callback(err);
              return;
            }

            if (result.tooMuchResults) {
              callback(null, result);
              return;
            }

            const totalPage = Math.ceil(result.resultsBeforeFiltering / PER_PAGE);

            resultsToSend.resultsTable = resultsToSend.resultsTable.concat(result.resultsTable);

            if (totalPage <= 1) {
              callback(null, result);
              return;
            }

            const pageRank = 2;
            const maxLoop = Math.min(totalPage, (MAX_RESULTS_TO_COMPUTE / PER_PAGE)) + 1;

            AsyncCallsSrv.asyncFor(pageRank, maxLoop,
              (index, next) => {
                getAllAssociations(associationName, associationDepartment, index, (error, _result) => {
                  if (error) {
                    next(error);
                    return;
                  }

                  resultsToSend.resultsTable = [
                    ...resultsToSend.resultsTable,
                    _result.resultsTable,
                  ];

                  next();
                });
              },
              (error) => {
                if (error) {
                  callback(error);
                  return;
                }

                callback(null, resultsToSend);
              });
          });
        },
      };

      return exports;
    },
  ]);
