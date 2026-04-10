$src = 'C:\Users\omari\Documents\Twitter Site\twitter_site_omar_1160\images'
$agency = 'C:\Users\omari\Documents\Twitter Site\twitter_site_omar_1160\agency-site\public\testimonials'
$sales = 'C:\Users\omari\Documents\Twitter Site\twitter_site_omar_1160\sales-site\public\testimonials'

Copy-Item "$src\Eric Da Silva testamonial.jpeg" "$agency\eric-da-silva.jpeg"
Copy-Item "$src\Footsplayer testamonial.jpeg" "$agency\footsplayer.jpeg"
Copy-Item "$src\Zackry testamonial 450 subs.jpeg" "$agency\zackry-3.jpeg"

Copy-Item "$src\Eric Da Silva testamonial.jpeg" "$sales\eric-da-silva.jpeg"
Copy-Item "$src\Footsplayer testamonial.jpeg" "$sales\footsplayer.jpeg"
Copy-Item "$src\Zackry testamonial 450 subs.jpeg" "$sales\zackry-3.jpeg"

Write-Host "Done!"
