angular.module('intia.services.establishments', []).factory('EstablishmentSrv', [
  'EstablishmentsApiSrv',
  (EstablishmentsApiSrv) => {
    /**
    * Merge two establishments
    * The most recently updated establishment has priority in case of conflict (same fields)
    * If we can't determine the most recently updated one, the first establishment has priority
    * @param {Object} sireneEstablishment First establishment to merge
    * @param {Object} rnaEstablishment Second establishment to merge
    * @return  {Object} Fusion between the establishments
    */
    const mergeEstablishments = (sireneEstablishment, rnaEstablishment) => {
      let mergeObject = { ...sireneEstablishment };
      let objectToTakeDataFrom = { ...rnaEstablishment };

      // Check if the second object's data has been updated later than the first's
      // If it is, we switch the values of mergeObject and objectToTakeDataFrom
      if (
        sireneEstablishment.updateDate
        && rnaEstablishment.updateDate
        && new Date(sireneEstablishment.updateDate) - new Date(rnaEstablishment.updateDate) < 0
      ) {
        mergeObject = { ...rnaEstablishment };
        objectToTakeDataFrom = { ...sireneEstablishment };
      }

      Object.keys(objectToTakeDataFrom).forEach((key) => {
        // If this field isn't common to the mergeObject
        if (!mergeObject[key]) {
          mergeObject[key] = objectToTakeDataFrom[key];
        }
      });

      return mergeObject;
    };

    /**
    * This function compare if two establishments are equal
    * @param {Object} sireneEstablishment First establishment to compare
    * @param {Object} rnaEstablishment Second establishment to compare
    */
    const isSameEstablishment = (sireneEstablishment = {}, rnaEstablishment = {}) => {
      // Two establishments with the same siret are equal
      // Two establishments with the same rna AND not distinct siret are equal
      // (Distinct meaning both defined with different values)
      const sameRna = !!sireneEstablishment.rna
        && !!rnaEstablishment.rna
        && sireneEstablishment.rna === rnaEstablishment.rna;

      const sameSiret = !!sireneEstablishment.siret
        && !!rnaEstablishment.siret
        && sireneEstablishment.siret === rnaEstablishment.siret;

      const distinctSiret = !!sireneEstablishment.siret
        && !!rnaEstablishment.siret
        && sireneEstablishment.siret !== rnaEstablishment.siret;

      return (sameRna && !distinctSiret) || sameSiret;
    };

    /**
     * Merge sirene and rna result tables without duplicates
     * @param {Array} sireneTable Result table from sirene
     * @param {Array} rnaTable Result table from rna
     */
    const mergeResultsTables = (sireneTable = [], rnaTable = []) => {
      const fusionTable = [];

      sireneTable.forEach((sireneEstablishment) => {
        let establishmentToPush = sireneEstablishment;

        if (sireneEstablishment.rna) {
          const index = rnaTable
            .findIndex((establishment) => isSameEstablishment(establishment, sireneEstablishment));

          if (index > -1) {
            // If the two establishments are equal
            // Merge them and remove the one from rnaTable
            const rnaEstablishment = rnaTable[index];
            rnaTable.splice(index, 1);
            establishmentToPush = mergeEstablishments(sireneEstablishment, rnaEstablishment);
          }
        }

        fusionTable.push(establishmentToPush);
      });

      return [...fusionTable, ...rnaTable];
    };

    /**
     * Call the sirene and rna api
     * @param {string} name The name of the establishment to search for
     * @param {string} department The department of the establishment to search for
     * @param {function} callback Callback to execute for each api call
     */
    const callApiServices = (name, department, callback) => {
      // Fetch sirene's api
      EstablishmentsApiSrv.getEstablishments(name, department, (errorSirene, resultSirene) => {
        if (errorSirene) {
          callback(errorSirene);
          return;
        }

        // Fetch rna's api
        EstablishmentsApiSrv.getEstablishments(name, department, (errorRna, resultRna) => {
          if (errorRna) {
            callback(errorRna);
            return;
          }

          callback(null, { resultSirene, resultRna });
        }, true);
      });
    };

    const exports = {
      /**
       * Fetch all establishments matching name and department filters
       * @param {*} name The name of the establishment
       * @param {*} department The department of the establishment (optional)
       * @return {Object}
       */
      getAllEstablishments(name, department, callback) {
        const response = {
          tooMuchResults: false,
          errorMsg: '',
          resultsBeforeFiltering: 0,
          resultsTable: [],
        };

        callApiServices(name, department, (error, { resultSirene, resultRna }) => {
          if (error) {
            callback(error);
            return;
          }

          response.resultsBeforeFiltering = resultSirene.resultsBeforeFiltering
            + resultRna.resultsBeforeFiltering;

          response.tooMuchResults = resultSirene.tooMuchResults || resultRna.tooMuchResults;

          // In any case, we have at least an empty array for both results
          response.resultsTable = !response.tooMuchResults
            ? mergeResultsTables(resultSirene.resultsTable, resultRna.resultsTable)
            : [];

          callback(null, response);
        });
      },

      /**
       * Return a array containing all the object having the same value in their department field
       *
       * Get an array of formatized establishment objects and filter all objects by comparing their department field's value with the department variable given
       * Return an array containing only the objects having the same department value in their department field
       *
       * @param {Array} establishmentsArray An array of establishment objects
       * @param {string} department the department value used to filter the establishmentArray
       */
      establishmentsResultsFiltering(establishmentsArray, department) {
        if (!establishmentsArray || !department) {
          return false;
        }

        return establishmentsArray.filter((establishment) => (establishment.department === department));
      },
    };

    return exports;
  },
]);
