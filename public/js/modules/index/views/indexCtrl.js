home.controller('IndexCtrl', [
  '$scope',
  'EstablishmentSrv',
  function ($scope, EstablishmentSrv) {
    // The max amount of results to show to the user
    const MAX_RESULTS_TO_SHOW = 10;

    // A list of french departments that are in fact string
    const STRING_DEPARTMENTS = ['2A', '2B'];

    $scope.$watchGroup(['view.establishments.searchSuccess'], (newVal) => {
      if (newVal[0]) {
        $scope.view.establishments.department = '';
      }
    });

    angular.extend($scope, {
      view: {
        maxResultsToShow: MAX_RESULTS_TO_SHOW,
        errorMsg: '',
        establishments: {
          name: '',
          department: '',

          // Two variables that will contains the last searched name and department
          // This two variables are used to know when the app should search for establishments or not
          previousSearchedName: '',
          previousSearchedDepartment: '',

          tooMuchResults: false,
          resultsBeforeFiltering: 0,
          searchSuccess: false,
          resultsTable: [],
        },
      },


      /**
       * This function check if the establishment's name entered by the user is unvalid
       *
       * This function does:
       * - Check if the name has value
       * - Check if the name is at least 3 caracters long
       *
       * @return {*}  return boolean statement
       */
      nameUnvalidity() {
        // Check if the name has value
        if (!$scope.view.establishments.name) {
          $scope.view.errorMsg = 'Veuillez rentrer un nom d\'établissement';
          return true;
        }

        // Check if the name is at least 3 caracters long
        if ($scope.view.establishments.name.length < 3) {
          $scope.view.errorMsg = 'Veuillez rentrer un nom d\'établissement d\'au moins 3 lettres';
          return true;
        }

        return false;
      },

      /**
       * Check if the department given has the same format as a french department
       *
       * return true statement if not
       * return false statement and set an error message for the user if not
       */
      departmentUnvalidity() {
        if ($scope.view.establishments.department.length >= 2) {
          // If the department isn't equal to one of the department that are in fact strings in STRING_DEPARTMENTS
          if (STRING_DEPARTMENTS.indexOf($scope.view.establishments.department) !== -1) {
            return false;
          }

          // If the department is in the list of french departments
          if (Number.isInteger(Number($scope.view.establishments.department))) {
            const integerDepartment = Number($scope.view.establishments.department);
            if ((integerDepartment > 0 && integerDepartment < 96) || (integerDepartment > 970 && integerDepartment < 977)) {
              return false;
            }
          }
        }

        $scope.view.errorMsg = 'Veuillez rentrer un departement français valide';
        return true;
      },


      /**
       *  Check if the key pressed by the user in one of the inputs of the formular is the "Enter" key (Enter value === 13)
       *  If it is, launch the establishmentsSearch() function to start apis call
       * @param {*} $event
       */
      enterKeyEstablishmentForm($event) {
        // If the key entered is equal to the value of the "Enter" key
        if ($event.keyCode === 13) {
          // Call the establishmentSearch() function
          $scope.establishmentsSearch();
        }
      },

      /**
       * Check if establishmentName is unvalid or not
       * Call establishmentFiltering() function of establishmentFilteringSrv or apiCall() function depending on the values of the name, department and resultsTable
       * Allow to reset department value if doing a new enterprise research
       */
      establishmentsSearch() {
        $scope.view.errorMsg = '';

        // We check the validity of the name
        if ($scope.nameUnvalidity()) {
          return;
        }

        // If the current searched establishment name is the same as the previous searched one
        if ($scope.view.establishments.name === $scope.view.establishments.previousSearchedName) {
          // If the current searched department name is different than the previous searched one
          if ($scope.view.establishments.department !== $scope.view.establishments.previousSearchedDepartment) {
            // If the searched department is null
            if (!$scope.view.establishments.department) {
              // We search the establishment by calling the api(s)
              $scope.apisCall();
            } else {
              // We check if the department is valid or not
              if ($scope.departmentUnvalidity()) {
                // If t's not valid we stop the search
                return;
              }

              // If there is already enterprises stored into the resultsTable
              if ($scope.view.establishments.resultsTable.length) {
                // We call the fucntion that will filter the resultTable
                $scope.view.establishments.resultsTable = EstablishmentSrv.establishmentsResultsFiltering($scope.view.establishments.resultsTable, $scope.view.establishments.department);
              } else {
                // We send the data to the api(s)
                $scope.apisCall();
              }
            }
          }
        } else {
          if ($scope.view.establishments.department) {
            if ($scope.departmentUnvalidity()) {
              // If t's not valid we stop the search
              return;
            }
          }

          // We search the establishment by calling the api(s)
          $scope.apisCall();
        }

        // At the end of the establishment search :
        // We update the value of the last establishment searched
        $scope.view.establishments.previousSearchedName = $scope.view.establishments.name;

        // We update the value of the last department searched
        $scope.view.establishments.previousSearchedDepartment = $scope.view.establishments.department;

        // We reset the value of the department to search
        $scope.view.establishments.department = '';
      },

      /**
       *  Reset the variables other then the name and department in order to start a new research
       *
       *  Check the validty of the name
       *
       *  Call the getEstablishments() function of the getEstablishmentsSrv service
       *
       *  await for the results before computing the retrieved data
       */
      apisCall() {
        // Reset the variables other then the name and department in order to start a new research
        $scope.view.establishments.tooMuchResults = false;
        $scope.view.establishments.searchSuccess = false;
        $scope.view.establishments.resultsBeforeFiltering = 0;
        $scope.view.establishments.resultsTable = [];

        // Call the getEstablishments() function of the getEstablishmentsSrv service
        // Use what the stringNormalize() function of the stringFormatingSrv service returns as the establishment's name

        EstablishmentSrv.getAllEstablishments($scope.view.establishments.name, $scope.view.establishments.department)
          .then(
            (response) => {
              $scope.view.establishments.tooMuchResults = response.tooMuchResults;
              $scope.view.establishments.resultsTable = response.resultsTable;
              $scope.view.establishments.resultsBeforeFiltering = response.resultsBeforeFiltering;
              $scope.view.establishments.searchSuccess = true;
            },
            (error) => {
              $scope.view.errorMsg = error;
              $scope.view.establishments.searchSuccess = true;
              $scope.view.establishments.resultsTable = [];
            },
          );
      },
    });
  },
]);
