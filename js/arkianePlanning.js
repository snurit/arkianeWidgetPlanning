(function($) {
    $.fn.arkianePlanning = function(options) {
        // Default settings
        var settings = $.extend({
            target: "#calendar",
            action: "build",
            //Minimum number of day before an available booking date
            minBookingDate : "+3D",
            //Maximum booking date
            maxBookingDate: "+8M",
            site: 1
        }, options );
        
        // Days available
        var dt = new Array();
        // Start bookin fays available
        var ds = new Array();

        //Build the base arkiane JQuery UI calendar
        if ( settings.action === "build") {
            // getting availabilities
            getAvailabilities(settings.usr, settings.pwd, settings.agency, settings.lot_ref, settings.site);
            getAvailableStartDate(settings.usr, settings.pwd, settings.agency, settings.lot_ref, settings.site);

            //console.log(dt);
            //console.log(ds);

            $(settings.target).datepicker({
                numberOfMonths: 2,
                showButtonPanel: true,
                //minDate : settings.minBookingDate,
                //maxDate : settings.maxBookingDate,
                beforeShowDay: function(date){
                    if ($.inArray(date.toISOString().substr(0,10), dt) >= 0) {
                        return [true,"date-available",""];
                    } else {
                        return [false,"date-unavailable",""];
                    }
                },
                onSelect: function(date){
                    if ($.inArray(date.toISOString().substr(0,10), ds) >= 0) {
                        return [true,"date-available",""];
                    }
                }
            });

            //Show the hidden calendar
            $(settings.target).css("visibility", "visible");
        }

        //Retrieving available date for a lot_ref
        function getAvailabilities(usr, pwd, agency, lot_ref, culture = "fr_FR", site = 1)
        {
            var url = "http://web4g.arkiane.com/api/api/"+usr+"/"+pwd+"/"+agency+"/"+site+"/fr-FR/Planning/Get?lot_ref="+lot_ref;
            var req = $.ajax({dataType: "jsonp", url: url, success: function(data) {
                $.each(data, function( index, value ){
                    Array.prototype.push.apply(dt, getDateRange(value.dispo_deb.substr(0,10), value.dispo_fin.substr(0,10)));
                });

                console.log("Nombre de jours dispos = "+dt.length);
            }});

            //Done when an error occur
            req.fail(function(){
                console.log("ERROR : unable to GET availabilities");
                return false;
            });
        }

        function getAvailableStartDate(usr, pwd, agency, lot_ref, culture = "fr_FR", site = 1){
            var url = "http://web4g.arkiane.com/api/api/"+usr+"/"+pwd+"/"+agency+"/"+site+"/fr-FR/Dates/Get?lot_ref="+lot_ref;
            var req = $.ajax({dataType: "jsonp", url: url, success : function (data) {
                $.each(data, function( index, value ){
                    ds.push(value.substr(0,10));
                });
                console.log("Nombre de jour de début spécifiés = "+ds.length);
            }});
            
            // Error
            req.fail(function(){
                console.log("ERROR : unable to GET available start dates");
                return false;
            });
        }

        //return an array of date between 2 dates
        function getDateRange(dateStart, dateEnd){
            var range = new Array();
            var currDate = new Date(dateStart);
            var tgtDate = new Date(dateEnd);

            while(currDate <= tgtDate){
                range.push(currDate.toISOString().substr(0,10));
                currDate = addDay(currDate);
            }
            return range;
        }
        
        //Add one day to increment a date
        function addDay(date) {
            var result = new Date(date);
            result.setDate(result.getDate() + 1);
            return result;
        }
    };
}(jQuery));