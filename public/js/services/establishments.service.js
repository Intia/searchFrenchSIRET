angular.module('intia.services.establishment', [])
  .factory('EstablishmentSrv', [
    'SireneSrv',
    'RnaSrv',
    (SireneSrv, RnaSrv) => {
      /**
       * This function get two objects and fuse their fields
       *
       * These object must be results of the apis's results treatment, and so have an updateDate fields in order to settle eventual conflicts
       *
       * The object with the most recent updateDate has the priority in case of conflicts beetwen the objects 'fields
       *
       * If we can't determine which object has the higher updateDate value, the first object has priority
       *
       *
       * @param {*} firstObject The first object to merge, if we can't use the updateDate of both fused object to settle potentil conflicts, we give priority to this firstObject
       * @param {*} secondObject The second Object to Merge, if we can't use the updateDate fields to settle conflicts, this object has no priority
       * @return  mergeObject variable containing the fuse of the two objects
       */

      const mergeTwoApiObject = (firstObject, secondObject) => {
        // The index of the object that we will take as base for the mergeObejct to return, it's default value is set on teh  firstObject given to the function

        // We initiate the mergeObject that will be returned at the end of the function
        let mergeObject = firstObject;
        let objectToTakeDataFrom = secondObject;

        // We put in a table the two copies of the two objects
        // We determine if the second object's data has been updated later than the first's
        if (
          firstObject.updateDate
          && secondObject.updateDate
          && new Date(firstObject.updateDate) - new Date(secondObject.updateDate) < 0
        ) {
          // If it is, we reverse the values of mergeObject and objectToTakeDataFrom
          // If not we do nothing and so the advantageObject value is still the firstObject index by default
          mergeObject = secondObject;
          objectToTakeDataFrom = firstObject;
        }

        // For each field in the objectToTakeDataFrom
        Object.keys(objectToTakeDataFrom).forEach((field) => {
          // If this field isn't common to the mergeObject
          if (!mergeObject[field]) {
            // We add the field into the advantaged object
            mergeObject[field] = objectToTakeDataFrom[field];
          }
        });

        // We return the mergeObject
        return mergeObject;
      };

      /**
       * The parameters of the function must be two resultsTable containing only objects returned by the different IntiaFormat functions
       * This function fuse the two tables by comparing each elements of the two tables
       *
       * @param {*} table1 sirene api Call's resultsTable
       * @param {*} table2 rna api Call's resultsTable
       */
      const mixUpResults = (table1, table2) => {
        // We initialize a fuseTable array that will contain the fuse of table1 and table2
        let fuseTable = [];

        // Get all the table1 that are in fact associations by checking the table1's rna fields
        table1.forEach((table1Object) => {
          if (table1Object) {
            // The object to push to the fuseTable, either it gets its value in the table2 loop, or at the end of the table1 loop
            let objectToPush;

            // A variable that shows if the table1Object has an occurence with an Object of table2
            let occurence = false;

            // For each object in table2
            for (let i = 0; i < table2.length; i += 1) {
              const table2Object = table2[i];

              // If table2's cell isn't empty
              if (table2Object) {
                /**
                 * This function compare if both object data is the same establishment's data
                 *
                 * @param {*} rna1 Rna of the first object
                 * @param {*} rna2 Rna of the second object
                 * @param {*} siret1 siret of the first object
                 * @param {*} siret2 siret of the second object
                 */
                const isSameEstablishment = (rna1, rna2, siret1, siret2) => {
                  // As long as (both object have same non-null rna values AND  both object haven't different non-null siret values) OR (both objects have the same non-null siret value)

                  const siretHaveDifferentValue = (siret1 && siret2 && siret1 !== siret2) === true;
                  const sameRna = (rna1 && rna1 === rna2) === true;
                  const sameSiret = (siret1 && siret1 === siret2) === true;

                  const cond = (sameRna && !siretHaveDifferentValue) || sameSiret;

                  // For unit test
                  // console.log( (rna1?'1':'0') + ' ' + (rna2?'1':'0') + ' ' + (siret1?'1':'0') + ' ' + (siret2?'1':'0') + ' => ' + cond);
                  return cond;
                };

                if (
                  isSameEstablishment(
                    table1Object.rna,
                    table2Object.rna,
                    table1Object.siret,
                    table2Object.siret,
                  )
                ) {
                  // We initiate a merge variable that will the fuse of the the table1Object and the table2Object
                  objectToPush = mergeTwoApiObject(table1Object, table2Object);

                  // We remove the compared association from the table2 in order not to push it a second time when pushing the remaining associations
                  // of table2 later
                  table2.splice(i, 1);

                  // We set the occurence variable to true
                  occurence = true;

                  // We stop the loop here
                  i = table2.length;
                }
              }
            }

            // If the table1Object has no occurence with an association of table2
            if (!occurence) {
              // The object to push is the table1Object of table1
              objectToPush = table1Object;
            }

            // We push the objectToPush to the fuseTable
            fuseTable.push(objectToPush);
          }
        });

        // We add the remaining table2Object in table2 by concating the fuseTable and the table2
        fuseTable = fuseTable.concat(table2);

        // We return the fuseTable
        return fuseTable;
      };

      /**
       * Call the sirene and rna api
       * @param {*} establishmentName The name of the establishment to search for
       * @param {*} establishmentDepartment The department of the establishment to search for
       * @param {*} callback the result to give back
       */
      const callApiServices = (
        establishmentName,
        establishmentDepartment,
        callback,
      ) => {
        // Call the getEstablishment function of the SireneSrv
        SireneSrv.getEstablishments(
          establishmentName,
          establishmentDepartment,
          (err, sireneResult) => {
            if (err) {
              callback(err);
              return;
            }

            // Call the getAssociation function of the RnaSrv
            RnaSrv.getAssociations(
              establishmentName,
              establishmentDepartment,
              (error, rnaResult) => {
                if (error) {
                  callback(error);
                  return;
                }

                const result = {
                  sirene: sireneResult,
                  rna: rnaResult,
                };

                callback(null, result);
              },
            );
          },
        );
      };

      const exports = {
        /**
         * getEstablishment search enterprises, associations and artisans from establishmentName AND establishmentDepartment
         * if founded enterprises/assocaition/artisan greater than 500, THROW an ErrorTooManyResult
         *
         * @param {*} establishmentName         The name of the establishment
         * @param {*} establishmentDepartment   The department of the establishment (can be empty)
         * @return [] :
         */
        getEstablishments(
          establishmentName,
          establishmentDepartment,
          callback,
        ) {
          // For the test of associations
          // console.clear();
          const establishmentsToSend = {
            tooMuchResults: false,
            errorMsg: '',
            resultsBeforeFiltering: 0,
            resultsTable: {
              // {
              //     id: Number,
              //     name1: String,
              //     name2: String
              //     address: String,
              //     city: String,
              //     siret: Number,
              //     siren: Number,
              //     naf: String,
              //     department: Number,
              //     cp: cp,
              //     legal_form: String,
              //     rna: String,
              //     creation_date: String,
              //     phone : String,
              // }
            },
          };

          callApiServices(establishmentName, establishmentDepartment, (
            err,
            results,
          ) => {
            if (err) {
              callback(err);
              return;
            }

            const sireneResult = results.sirene;
            const rnaResult = results.rna;

            establishmentsToSend.resultsBeforeFiltering = sireneResult.resultsBeforeFiltering
              + rnaResult.resultsBeforeFiltering;

            // If neither sireneResult and rnaResult are too high
            if (!sireneResult.tooMuchResults && !rnaResult.tooMuchResults) {
              // sireneResult.resultsTable or rnaResults.resultsTable isn't empty
              if (
                sireneResult.resultsTable.length
                || rnaResult.resultsTable.length
              ) {
                // If we got results from both api
                if (
                  sireneResult.resultsTable.length
                  && rnaResult.resultsTable.length
                ) {
                  // We fuse the two array
                  establishmentsToSend.resultsTable = mixUpResults(
                    sireneResult.resultsTable,
                    rnaResult.resultsTable,
                  );
                } else {
                  // We add the result gotten
                  establishmentsToSend.resultsTable = sireneResult.resultsTable.concat(
                    rnaResult.resultsTable,
                  );
                }
              }
            } else {
              establishmentsToSend.tooMuchResults = true;
            }

            callback(null, establishmentsToSend);
          });
        },

        /**
         * Filters an array of establishments according to their department field
         *
         * @param {Array} establishmentsArray An array of establishment objects to filter
         * @param {string} department The department value used to filter establishments
         * @return {Array}
         */
        filterEstablishments(establishmentsArray, department) {
          if (!establishmentsArray || !department) {
            return null;
          }

          // The filter() function add in its own array it just created
          // all the establishments of the the scope.view.establishments.resultsTable's array whose department is equal to establishmentsDepartment
          return establishmentsArray
            .filter((establishment) => establishment.department === department);
        },
      };

      return exports;
    },
  ]);
