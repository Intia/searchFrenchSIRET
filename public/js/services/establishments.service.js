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
     */
    const callApiServices = (name, department) => EstablishmentsApiSrv
      .getEstablishments(name, department) // Fetch Sirene's API
      .catch((errorSirene) => { throw errorSirene; })
      .then((responseSirene) => EstablishmentsApiSrv
        .getEstablishments(name, department, true) // Fetch rna's api
        .catch((errorRna) => { throw errorRna; })
        .then((responseRna) => ({ responseSirene, responseRna })));

    const exports = {
      /**
       * Fetch all establishments matching name and department filters
       * @param {*} name The name of the establishment
       * @param {*} department The department of the establishment (optional)
       * @return {Object}
       */
      getAllEstablishments(name, department) {
        const response = {
          tooMuchResults: false,
          errorMsg: '',
          resultsBeforeFiltering: 0,
          resultsTable: [],
        };

        return new Promise((resolve, reject) => {
          callApiServices(name, department)
            .catch((error) => reject(error))
            .then(({ responseSirene, responseRna }) => {
              response.resultsBeforeFiltering = responseSirene.resultsBeforeFiltering
                + responseRna.resultsBeforeFiltering;

              response.tooMuchResults = responseSirene.tooMuchResults || responseRna.tooMuchResults;

              // In any case, we have at least an empty array for both results
              response.resultsTable = !response.tooMuchResults
                ? mergeResultsTables(responseSirene.resultsTable, responseRna.resultsTable)
                : [];

              resolve(response);
            });
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
