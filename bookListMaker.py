import requests

def get_openlibrary_link(book_title, author_name):
    # Open Library search URL for title and author
    search_url = f"https://openlibrary.org/search.json?title={book_title}&author={author_name}"
    
    # Send the request to Open Library
    response = requests.get(search_url)
    
    if response.status_code == 200:
        data = response.json()
        # Check if Open Library returned any results
        if data['num_found'] > 0:
            # Get the first result's key to form the link
            key = data['docs'][0]['key']
            return f"https://openlibrary.org{key}"
        else:
            return None
    else:
        return None

def get_librarything_link(book_title, author_name):
    # LibraryThing search URL for book title
    search_url = f"https://www.librarything.com/search_works.php?searchType=title&search={book_title}"
    
    # Send request to LibraryThing
    response = requests.get(search_url)
    
    if response.status_code == 200:
        # Check if results are found (look for relevant content in the response)
        if "No works found" not in response.text:
            return search_url  # Return the search URL, or you could extract a specific link from the response
        else:
            return None
    else:
        return None

def get_book_link(book_title, author_name):
    # First, try Open Library
    openlibrary_link = get_openlibrary_link(book_title, author_name)
    
    # If Open Library link is not found, fallback to LibraryThing
    if openlibrary_link:
        return openlibrary_link
    else:
        return get_librarything_link(book_title, author_name)

# Example book titles and authors
books = [
    {"title": "Serpent's Secret", "author": "Sayantani DasGupta"},
    {"title": "System Collapse", "author": "Martha Wells"}
]

# Output the links
for book in books:
    book_link = get_book_link(book['title'], book['author'])
    if book_link:
        print(f'| {book["title"]} | {book["author"].replace(", ", "<br>")} | [Book Details]({book_link}) | 👍 |')
    else:
        print(f"No link found for {book['title']} by {book['author']}")
