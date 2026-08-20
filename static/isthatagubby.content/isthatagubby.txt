import pygame
import sys

pygame.init()
pygame.mixer.init()

W, H = 800, 600
win = pygame.display.set_mode((W, H))
pygame.display.set_caption("is that a gubby?????")
fps = pygame.time.Clock()

bg = (15, 15, 25)
white = (255, 255, 255)
uicolor = (40, 44, 52)

gubbies = 0
gps = 0
click_power = 1

cost = 10
lvl = 0

timer = pygame.time.get_ticks()

try:
    img1 = pygame.image.load("images/toby.png")
    img1 = pygame.transform.scale(img1, (200, 250))
    img2 = pygame.image.load("images/gubby.png")
    img2 = pygame.transform.scale(img2, (80, 80))
except:
    img1 = pygame.Surface((200, 250))
    img1.fill((255, 0, 0))
    img2 = pygame.Surface((80, 80))
    img2.fill((0, 255, 0))

try:
    snd = pygame.mixer.Sound("images/isthatagubby.mp3")
except:
    snd = None

toby_rect = img1.get_rect(center=(W // 3, H // 2))
up_rect = pygame.Rect(550, 250, 220, 100)

f1 = pygame.font.SysFont("Arial", 40, bold=True)
f2 = pygame.font.SysFont("Arial", 20)

while True:
    now = pygame.time.get_ticks()
    if now - timer >= 1000:
        gubbies += gps
        timer = now

    for e in pygame.event.get():
        if e.type == pygame.QUIT:
            pygame.quit()
            sys.exit()
            
        if e.type == pygame.MOUSEBUTTONDOWN and e.button == 1:
            if toby_rect.collidepoint(e.pos):
                gubbies += click_power
                if snd:
                    snd.play()
                    
            if up_rect.collidepoint(e.pos):
                if gubbies >= cost:
                    gubbies -= cost
                    lvl += 1
                    gps += 2
                    cost = int(cost * 1.5)
                    if snd:
                        snd.play()

    win.fill(bg)
    
    win.blit(f1.render(f"Gubbies:: {gubbies}", True, white), (50, 50))
    win.blit(f2.render(f"Gubbies per second: {gps}", True, (200, 200, 200)), (50, 100))

    win.blit(img1, toby_rect.topleft)
    
    pygame.draw.rect(win, uicolor, up_rect, border_radius=8)
    win.blit(img2, (up_rect.x + 10, up_rect.y + 10))
    
    win.blit(f2.render("REALISTIC GUBY", True, white), (up_rect.x + 100, up_rect.y + 15))
    win.blit(f2.render(f"it costs: {cost}", True, (255, 215, 0)), (up_rect.x + 100, up_rect.y + 40))
    win.blit(f2.render(f"level: {lvl} like (+2/s)", True, (150, 150, 150)), (up_rect.x + 100, up_rect.y + 65))

    pygame.display.flip()
    fps.tick(60)