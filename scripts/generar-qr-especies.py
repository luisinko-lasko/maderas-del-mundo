import json,zipfile,csv,io,math,argparse
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics import renderPDF,renderSVG
parser=argparse.ArgumentParser(description='Generar QR por especie para el expositor')
parser.add_argument('--datos',required=True,help='JSON con xilo_id y nombre de cada especie')
parser.add_argument('--salida',default='qr-exportados')
args=parser.parse_args()
root=Path(args.salida).resolve();root.mkdir(parents=True,exist_ok=True)
datos=json.loads(Path(args.datos).read_text());out=root/'QR_Especies_Maderas_del_Mundo.pdf'
if not datos or len({m['xilo_id'] for m in datos}) != len(datos):raise SystemExit('El JSON debe contener especies sin números repetidos')
font_dir=Path('/usr/share/fonts/truetype/dejavu')
if font_dir.exists():
 pdfmetrics.registerFont(TTFont('MDM',str(font_dir/'DejaVuSans.ttf')))
 pdfmetrics.registerFont(TTFont('MDMBold',str(font_dir/'DejaVuSans-Bold.ttf')))
else:
 pdfmetrics.registerFont(pdfmetrics.Font('MDM','Helvetica','WinAnsiEncoding'))
 pdfmetrics.registerFont(pdfmetrics.Font('MDMBold','Helvetica-Bold','WinAnsiEncoding'))
W,H=A4;c=canvas.Canvas(str(out),pagesize=A4);c.setTitle('QR por especie de Maderas del Mundo')
links=[];svgs=root/'svg';svgs.mkdir(exist_ok=True)
def drawing(url,size):
 q=QrCodeWidget(url,barLevel='M',barBorder=4);x0,y0,x1,y1=q.getBounds();d=Drawing(size,size,transform=[size/(x1-x0),0,0,size/(y1-y0),-x0,-y0]);d.add(q);return d
cw=62*mm;ch=49*mm;ox=12*mm;top=H-30*mm
for idx,m in enumerate(datos):
 n=idx%15
 if n==0:
  c.setFont('MDMBold',14);c.drawString(12*mm,H-14*mm,'Maderas del Mundo')
  c.setFont('MDM',9);c.drawString(12*mm,H-20*mm,'Un QR por especie · Añadir a mi colección · Imprimir al 100%')
 x=ox+(n%3)*cw;y=top-(n//3+1)*ch;url=f"https://www.maderasdelmundo.es/coleccion/anadir/{m['xilo_id']}"
 c.setStrokeColorRGB(.8,.8,.8);c.setLineWidth(.35);c.rect(x,y,cw,ch)
 size=31*mm;renderPDF.draw(drawing(url,size),c,x+(cw-size)/2,y+10*mm)
 c.setFillColorRGB(0,0,0);c.setFont('MDMBold',9.5)
 label=f"#{m['xilo_id']:03d} · {m['nombre']}"
 while c.stringWidth(label,'MDMBold',c._fontsize)>cw-5*mm:c.setFont('MDMBold',c._fontsize-.3)
 c.drawCentredString(x+cw/2,y+6*mm,label)
 c.setFont('MDM',7.5);c.drawCentredString(x+cw/2,y+2.5*mm,'Escanea para añadir a tu colección')
 c.linkURL(url,(x,y,x+cw,y+ch),relative=0)
 renderSVG.drawToFile(drawing(url,300),str(svgs/f"{m['xilo_id']:03d}.svg"))
 links.append((m['xilo_id'],m['nombre'],url))
 if n==14 or idx==len(datos)-1:
  c.setFont('MDM',8);c.drawRightString(W-12*mm,10*mm,f"Página {idx//15+1} de {math.ceil(len(datos)/15)}");c.showPage()
c.save()
buf=io.StringIO();writer=csv.writer(buf);writer.writerow(['xilo_id','nombre','url']);writer.writerows(links)
(root/'enlaces.csv').write_text(buf.getvalue(),encoding='utf-8-sig')
with zipfile.ZipFile(root/'QR_Especies_Individuales.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(svgs.glob('*.svg')):z.write(p,'QR/'+p.name)
 z.write(root/'enlaces.csv','enlaces.csv')
print({'qr':len(links),'paginas':math.ceil(len(datos)/15),'pdf':str(out)})
