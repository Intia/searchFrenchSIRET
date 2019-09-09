angular.module('intia.services.asyncCalls', [])
  .factory('AsyncCallsSrv', [
    () => ({
      /**
       * Launch a function in a loop depending on the min, max and function parameters given
       * @param {*} min           The value the loop start from
       * @param {*} max           The value the loop stop to
       * @param {*} loopFunction  The function that will be launched at each iteration
       * @param {*} callback      What the function returns
       */
      asyncFor(min, max, loopFunction, callback) {
        let i = min;
        const exec = () => {
          if (i < max) {
            loopFunction(i, (err) => {
              if (err) {
                callback(err);
                return;
              }

              i += 1;
              exec();
            });

            return;
          }

          callback();
        };

        exec();
      },
    }),
  ]);
