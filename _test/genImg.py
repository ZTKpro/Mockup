from PIL import Image, ImageDraw
import random
import os

# Upewnij się, że katalog do zapisu istnieje
output_dir = "."
os.makedirs(output_dir, exist_ok=True)

def create_grid_image(width, height):
    # Dostosuj wymiary, aby były podzielne przez 100 (zapewni to równe komórki)
    width = (width // 100) * 100
    height = (height // 100) * 100
    
    # Stwórz puste przezroczyste zdjęcie
    image = Image.new('RGBA', (width, height), color=(0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    
    # Oblicz szerokość i wysokość każdej komórki siatki
    cell_width = width / 100
    cell_height = height / 100
    
    # Narysuj poziome linie (włącznie z górną i dolną krawędzią)
    for i in range(101):
        y = int(i * cell_height)
        # Zapewnij, że dolna krawędź jest dokładnie na końcu obrazu
        if i == 100:
            y = height - 1
        draw.line([(0, y), (width-1, y)], fill='red', width=1)
    
    # Narysuj pionowe linie (włącznie z lewą i prawą krawędzią)
    for i in range(101):
        x = int(i * cell_width)
        # Zapewnij, że prawa krawędź jest dokładnie na końcu obrazu
        if i == 100:
            x = width - 1
        draw.line([(x, 0), (x, height-1)], fill='red', width=1)
    
    # Utwórz nazwę pliku zawierającą wymiary
    filename = os.path.join(output_dir, f"siatka_{width}x{height}.png")
    
    # Zapisz zdjęcie
    image.save(filename)
    print(f"Utworzono {filename}")
    
    return filename

# Wygeneruj 10 zdjęć o różnych wymiarach
generated_files = []
for i in range(10):
    # Wygeneruj losowe wymiary między 400 a 1000 pikseli, podzielne przez 100
    width = random.randint(4, 10) * 100
    height = random.randint(4, 10) * 100
    
    # Utwórz i zapisz zdjęcie
    file_path = create_grid_image(width, height)
    generated_files.append(file_path)

print("\nWszystkie zdjęcia zostały wygenerowane pomyślnie!")
print("Wygenerowane pliki:")
for file in generated_files:
    print(f"- {os.path.basename(file)}")