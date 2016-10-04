(function($) {
    $.fn.arkianePlanning = function(options) {
        
        var settings = $.extend({
            // Default settings
            target: "#calendar",
            action: "build"
        }, options );
        
        //Build the base arkiane JQuery UI calendar
        if ( settings.action === "build") {
            $(settings.target).datepicker({
                numberOfMonths: 2,
                showButtonPanel: true
            });
        }
    };
}(jQuery));