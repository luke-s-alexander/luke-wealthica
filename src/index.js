var addon, addonOptions;

$(function () {
  addon = new Addon();

  addon.on('init', function (options) {
    // Dashboard is ready and is signaling to the add-on that it should
    // render using the passed in options (filters, language, etc.)
    addonOptions = options;
    $('button').removeAttr('disabled');
    showAddonData(addonOptions.data, true);
  }).on('update', function (options) {
    // Filters have been updated and Dashboard is passing in updated options
    addonOptions = _.extend(addonOptions, options);
    showAddonData(addonOptions.data);
  });

  $('#addTransaction').on('click', function () {
    $(this).attr('disabled', 'disabled');

    addon.addTransaction({
      description: "New transaction from Example Add-on"
    }).then(function (transaction) {
      $('#result').html('New transaction:<br><code>' + JSON.stringify(transaction) + '</code>');
    }).catch(function (err) {
      $('#result').html('Error:<br><code>' + err + '</code>');
    }).finally(function () {
      $('#addTransaction').removeAttr('disabled');
    });
  });

  $('#getTransactions').on('click', function () {
    $(this).attr('disabled', 'disabled');

    addon.api.getTransactions(getQueryFromOptions(addonOptions)).then(function (response) {
      $('#result').html('List Transactions Result:<br><code>' + JSON.stringify(response, null, 2) + '</code>');
      exportTransactionsToCsvFile(response);
    }).catch(function (err) {
      $('#result').html('Error:<br><code>' + err + '</code>');
    }).finally(function () {
      $('#getTransactions').removeAttr('disabled');
    });
  });

  $('#getPositions').on('click', function () {
    $(this).attr('disabled', 'disabled');

    addon.api.getPositions(getQueryFromOptions(addonOptions)).then(function (response) {
      $('#result').html('List Positions Result:<br><code>' + JSON.stringify(response, null, 2) + '</code>');
      exportPositionsToCsvFile(response);
    }).catch(function (err) {
      $('#result').html('Error:<br><code>' + err + '</code>');
    }).finally(function () {
      $('#getPositions').removeAttr('disabled');
    });
  });
  
  $('#getInstitutions').on('click', function () {
    $(this).attr('disabled', 'disabled');
    
    addon.api.getInstitutions(getQueryFromOptions(addonOptions)).then(function (response) {
      $('#result').html('List Institutions Result:<br><code>' + JSON.stringify(response, null, 2) + '</code>');
    }).catch(function (err) {
       $('#result').html('Error:<br><code>' + err + '</code>'); 
    }).finally(function () {
      $('#getPositions').removeAttr('disabled');
    });
  });

  $('#getAssets').on('click', function () {
    $(this).attr('disabled', 'disabled');
    
    addon.api.getAssets(getQueryFromOptions(addonOptions)).then(function (response) {
      $('#result').html('List Assets Result:<br><code>' + JSON.stringify(response, null, 2) + '</code>');
    }).catch(function (err) {
       $('#result').html('Error:<br><code>' + err + '</code>'); 
    }).finally(function () {
      $('#getAssets').removeAttr('disabled');
    });
  });

  // $('#getInstitutionAssets').on('click', function () {
  //   $(this).attr('disabled', 'disabled');
    
  //   addon.request({
  //     method: 'GET',
  //     endpoint: 'assets'
  //   }).then(function (response) {
  //     $('#result').html('List Assets Result:<br><code>' + JSON.stringify(response, null, 2) + '</code>');
  //   }).catch(function (err) {
  //      $('#result').html('Error:<br><code>' + err + '</code>'); 
  //   }).finally(function () {
  //     $('#getInstitutionAssets').removeAttr('disabled');
  //   });
  // });

  $('#saveData').on('click', function () {
    $(this).attr('disabled', 'disabled');
    var newData = $('#data').val();

    // Try parsing textarea value to a JSON object before passing to addon.saveData(data)
    try { newData = JSON.parse(newData) }
    catch (e) {
      $('#result').html('Error:<br><code>Data must be JSON</code>');
      $('#saveData').removeAttr('disabled');
      return;
    }

    addon.saveData(newData).catch(function (err) {
      $('#result').html('Error:<br><code>' + err + '</code>');
    }).finally(function () {
      $('#saveData').removeAttr('disabled');
    });
  });

  addon.on('postMessage', function (origin, message) {
  console.log(arguments);
  });

  addon.on('gotMessage', function (origin, message) {
  console.log(arguments);
  });

  // Show addon data in result box and optionally update the text input.
  function showAddonData(data, updateInput) {
    $('#result').html('Addon data:<br><code>' + JSON.stringify(data, null, 2) + '</code>');
    if (updateInput && data) {
      $('#data').val(JSON.stringify(data));
    }
  }

  // Compose a query object from the addon options to pass to the API calls.
  function getQueryFromOptions (options) {
    return {
      from: options.dateRangeFilter && options.dateRangeFilter[0],
      to: options.dateRangeFilter && options.dateRangeFilter[1],
      groups: options.groupsFilter,
      institutions: options.institutionsFilter,
      investments: options.investmentsFilter === 'all' ? null: options.investmentsFilter,
    }
  }

  // Parse Positions JSON object into CSV string
  function parsePositionsToCsvFile(jsonData) {
    if(jsonData.length == 0) {
      return '';
    }
    // Create array of column headers
    let keys = [
        'category', 
        'class', 
        'symbol', 
        'alias', 
        'investment', 
        'quantity', 
        'book_value', 
        'market_value', 
        'currency', 
        'gain_percent', 
        'gain_amount'
    ];
    // Set formats
    let columnDelimiter = ',';
    let lineDelimiter = '\n';
    // Build header
    let csvColumnHeader = keys.join(columnDelimiter);
    let csvStr = csvColumnHeader + lineDelimiter;
    var shared = []
    // Loop through position results
    jsonData.forEach(item => {
      // Don't print any data at the position level, but capture shared data
      shared = [ 
          item.category, 
          item.class, 
          item.security.symbol, 
          item.security.aliases[0] 
      ];
      // Loop through investments for each position
      item.investments.forEach(element => {
        var investment_data = [
            element.investment, 
            element.quantity, 
            element.book_value, 
            element.market_value, 
            element.currency, 
            element.gain_percent, 
            element.gain_amount
        ];
        // Add investment data to shared position data
        investment_data = shared.concat(investment_data);
        // Loop through investment data and create csv row
        investment_data.forEach((entry, index) => {
            if( (index > 0) && (index < investment_data.length) ) {
                csvStr += columnDelimiter;
            }
            csvStr += entry;
        });
        csvStr += lineDelimiter
      });
    });
   return encodeURIComponent(csvStr);
  };

// Parse Transactions JSON object into CSV string
  function parseTransactionsToCsvFile(jsonData) {
    if(jsonData.length == 0) {
      return '';
    }
    // Create array of column headers
    let keys = [
        'account',
        'account_type',
        'account_currency', 
        'type', 
        'date', 
        'quantity',  
        'currency_amount',  
        'fee',
        'symbol', 
        'name', 
        'currency'
    ];
    // Set formats
    let columnDelimiter = ',';
    let lineDelimiter = '\n';
    // Build header
    let csvColumnHeader = keys.join(columnDelimiter);
    let csvStr = csvColumnHeader + lineDelimiter;
    var row = [];
    var parsedInvestment = [];
    // Loop through transaction results
    jsonData.forEach(item => {
      // Create row from transaction data
      investment = item.investment;
      parsedInvestment = investment.split(":")
      row = [  
          parsedInvestment,
          item.type,
          item.date,
          item.quantity,
          item.currency_amount,
          item.fee
      ];
      // Check to see if transaction references a security
      if(typeof item.security === "object") {
        // Add security data if available
        row = row.concat([
          item.security.symbol,
          item.security.name,
          item.security.currency
        ]);
      } else {
        // Add null placeholders if no security data
        row.push(null, null, null)
      };
      // Loop through row data and create csv row
      row.forEach((entry, index) => {
          if( (index > 0) && (index < row.length) ) {
              csvStr += columnDelimiter;
          }
          csvStr += entry;
      });
      csvStr += lineDelimiter
    });
   return encodeURIComponent(csvStr);
  };

  // Parse JSON object into CSV string
  function exportTransactionsToCsvFile(jsonData) {
      let csvStr = parseTransactionsToCsvFile(jsonData);
      let dataUri = 'data:text/csv;charset=utf-8,'+ csvStr;
      var today = new Date();
      var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
      var time = today.getHours().toString() + today.getMinutes() + today.getSeconds();

      let exportFileDefaultName = 'transactions_' + date + time + '.csv';

      let linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
  };

  // Parse JSON object into CSV string
  function exportPositionsToCsvFile(jsonData) {
      let csvStr = parsePositionsToCsvFile(jsonData);
      let dataUri = 'data:text/csv;charset=utf-8,'+ csvStr;
      var today = new Date();
      var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
      var time = today.getHours().toString() + today.getMinutes() + today.getSeconds();

      let exportFileDefaultName = 'positions_' + date + time + '.csv';

      let linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
  };

});