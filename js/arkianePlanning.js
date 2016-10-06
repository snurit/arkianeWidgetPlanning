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
        
        //Build the base arkiane JQuery UI calendar
        if ( settings.action === "build") {
            // getting availabilities
            var datesAvailable = new Array();
            datesAvailable = getAvailabilities(settings.usr, settings.pwd, settings.agency, settings.lot_ref, settings.site);
            availableStartDate = getAvailableStartDate(settings.usr, settings.pwd, settings.agency, settings.lot_ref, settings.site);
            console.log(availableStartDate.length);

            $(settings.target).datepicker({
                numberOfMonths: 2,
                showButtonPanel: true,
                //minDate : settings.minBookingDate,
                //maxDate : settings.maxBookingDate,
                beforeShowDay: function(date){
                    dmy = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
                    
                    if ($.inArray(dmy, datesAvailable) < 0) {
                        return [true,"date-available"];
                    } else {
                        console.log("in date unavailable");
                        return [false,"date-unavailable"];
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
            var req = $.ajax({dataType: "jsonp", url: url});
            var dt = new Array();

            //Done when OK
            req.done(function (data) {
                $.each(data, function( index, value ){
                    dt = dt.concat(getDateRange(new Date(value.dispo_deb), new Date(value.dispo_fin)));
                });

                console.log("Nombre de jours dispos = "+dt.length);
                return dt;
            });
            
            //Done when an error occur
            req.fail(function(){
                console.log("ERROR : unable to GET availabilities");
                return false;
            });
        }

        function getAvailableStartDate(usr, pwd, agency, lot_ref, culture = "fr_FR", site = 1){
            var url = "http://web4g.arkiane.com/api/api/"+usr+"/"+pwd+"/"+agency+"/"+site+"/fr-FR/Dates/Get?lot_ref="+lot_ref;
            var req = $.ajax({dataType: "jsonp", url: url});
            var dt = new Array();

            // OK
            req.done(function (data) {
                $.each(data, function( index, value ){
                    dt.push(new Date(value));
                });
                console.log("Nombre de jour de début spécifiés = "+dt.length);
                return dt;
            });
            
            // Error
            req.fail(function(){
                console.log("ERROR : unable to GET available start dates");
                return false;
            });
        }

        //return an array of date between 2 dates
        function getDateRange(dateStart, dateEnd){
            var range = new Array();
            var currDate = dateStart;

            while(currDate <= dateEnd){
                range.push(currDate);
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