document.addEventListener('DOMContentLoaded', function() {
    console.log("Widget Loaded!");

    
    const matches = document.querySelectorAll('.match');
    matches.forEach(function(match) {
        match.style.padding = '20px'; 
    });
});
