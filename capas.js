/* =====================================================================
   capas.js  –  AQUÍ SE CONFIGURAN LAS CAPAS, SU SIMBOLOGÍA Y SUS POPUPS
   (es el único archivo que editarás casi siempre)

   ESTRUCTURA DE ESTE ARCHIVO
     1. ESTILOS  → «recetas» de simbología que puedes reutilizar en varias capas
     2. POPUPS   → «recetas» de ventana emergente que puedes reutilizar
     3. CATEGORIAS → las categorías del panel y las capas de cada una

   CADA CAPA se escribe de una de estas formas:
     'Nombre de la capa'                       → capa de EJEMPLO (cuadritos de prueba)
     { n:'Nombre', estilo:{...} }              → capa de EJEMPLO con su propia simbología
     { n:'Nombre', f:'data/archivo.geojson',   → capa REAL leída desde tu GeoJSON
       estilo:ESTILOS.algo, popup:POPUPS.algo }   (guarda tus GeoJSON en la carpeta data/)

   OPCIONES DE UNA CAPA (todas opcionales salvo n)
     f        → archivo GeoJSON
     z        → zoom mínimo para verla (ej. 15 para lotes). Si te alejas, se oculta sola.
     opacidad → opacidad inicial del deslizador, de 0.1 a 1 (por defecto 0.6)
     fuente / escala / fecha → datos de la ficha «i». Si cambias la «fecha», el navegador
                descarga el archivo de nuevo en lugar de usar una copia vieja.
     buscar   → columnas por las que se buscan elementos, ej. buscar:['NOMBRE','CODIGO']
     estilo   → simbología de ESTA capa (ver abajo). Si no lo pones, usa el color de su categoría.
     popup    → ventana emergente de ESTA capa (ver abajo).

   ---------------------------------------------------------------------
   SIMBOLOGÍA  (estilo:{ ... })  — cada capa tiene la suya, aunque compartan categoría

   Elige UNA de las tres formas de dar color:
     a) Un solo color:           { color:'#7a3db8' }
     b) Por categorías (texto):  { campo:'ZONA', colores:{ 'RDM':'#f4d03f', 'CZ':'#e74c3c' } }
     c) Por rangos (números):    { campo:'AREA_M2', rangos:[ {hasta:120, color:'#fde68a'},
                                                             {hasta:300, color:'#f59e0b'},
                                                             {color:'#b45309'} ] }
        · «hasta» incluye ese valor; el último rango, sin «hasta», recoge todo lo que sobra.

   Y estas opciones de forma, para cualquiera de las tres:
     colorBorde:'#4b1e80'   color del borde (si no lo pones, el borde usa el color de relleno)
     grosor:2               grosor del borde en píxeles (por defecto 1)
     relleno:false          solo borde, sin relleno (útil para límites)
     discontinua:'8 6'      borde de trazos: «largo vacío» (ej. '8 6', '2 5')
     radio:7                tamaño de los puntos (capas de puntos)
     defecto:'#9aa5b1'      color de lo que no entra en «colores» ni «rangos»
     etiquetas:{ 'RDM':'Residencial densidad media' }   textos de la leyenda (categorías)
     En «rangos» cada rango acepta  etiqueta:'Hasta 120 m²'  para el texto de la leyenda.

   Puedes partir de una receta y cambiar una parte:  estilo:{ ...ESTILOS.limite, grosor:5 }

   ---------------------------------------------------------------------
   POPUP  (popup:{ ... })  — qué se muestra al hacer clic en un elemento

     titulo:'Distrito {NOMBRE}'    título; {COLUMNA} se reemplaza por el valor de esa columna.
                                   Si no lo pones, se usa el nombre de la capa. titulo:false lo quita.
     campos:[ ... ]                columnas a mostrar, en este orden. Cada una puede ser:
                                     'CODIGO'                        → solo el nombre de la columna
                                     { campo:'AREA_KM2', etiqueta:'Superficie',
                                       decimales:1, prefijo:'~', sufijo:' km²' }    → con formato
                                     { campo:'USO', etiqueta:'Uso',
                                       mapa:{ V:'Vivienda', C:'Comercio' } }        → traduce códigos
                                     { campo:'FOTO', etiqueta:'Foto', imagen:true }  → muestra una imagen
                                     { campo:'FICHA', enlace:true, texto:'Ver ficha' } → enlace
                                   Si no pones «campos», se muestran todas las columnas.
     ocultar:['OBJECTID']          (sin «campos») columnas que NO quieres mostrar
     pie:'Fuente: {FUENTE}'        texto pequeño al final
     ancho:320                     ancho máximo en píxeles (por defecto 300)
     html: p => '<b>'+p.NOMBRE+'</b>'   control TOTAL: tú escribes el HTML con los datos «p» del elemento.
                                   Usa esc(valor) para insertar texto de forma segura.
     Las filas vacías no se muestran.

   ---------------------------------------------------------------------
   ORDEN DE APILAMIENTO  (campo  nivel  de cada categoría)
   Las categorías con «nivel» más alto se dibujan ENCIMA de las de nivel más bajo,
   sin importar en qué orden las enciendas. Así los lotes nunca quedan tapados por un límite.

   Si escribes mal una opción o una columna, el visor avisa (mira la consola con F12).
   ===================================================================== */

const CENTRO = [-11.865, -77.075];   // [latitud, longitud] del centro inicial
const ZOOM   = 12;                   // zoom inicial

/* ---------------------------------------------------------------------
   1. ESTILOS (recetas reutilizables). Crea las tuyas copiando una y cambiando los datos.
   --------------------------------------------------------------------- */
const ESTILOS = {
    
  COFOPRI:{ color:'#e9681288', colorBorde:'#fc7100', grosor:2, relleno:true},
 
  HAB_URBANA:{ color:'#19e9128c', colorBorde:'#04f804', grosor:2, relleno:true},
 
  ORD_038:{ color:'#f4f8098c', colorBorde:'#f4f806', grosor:2, relleno:true},
 
  P_RUSTICA:{ color:'#b409f87a', colorBorde:'#d908f5', grosor:2, relleno:true},
 
  SECTOR:{ color:'#b409f87a', colorBorde:'#0408f3', grosor:2, relleno:false},
 
  ZONAS:{
    campo:'RefName',
    colores:{ 'Zona Norte':'#FFF07A', 'Zona Centro':'#30DDFF', 'Zona Sur':'#FF0000'},
    etiquetas:{ 'Zona Norte':'Zona Norte', 'Zona Centro':'Zona Centro',
                'Zona Sur':'Zona Sur'},      
    colorBorde:'#555', grosor:1, defecto:'#cfd8dc'
  },

  VIAS_MET:{
    campo:'clasif',
    colores:{ 'COLECTORA':'#FAAC11', 
              'COLECTORA INTERDISTRITAL':'#F26B11',
              'ARTERIALES':'#68F72F',
              'EXPRESA SUB REGIONAL':'#945400',
              'EXPRESA METROPOLITANA':'#000000',
              'EXPRESA NACIONAL-REGIONAL':'#FA0C0C'},

    etiquetas:{ 'COLECTORA':'COLECTORA',
                'COLECTORA INTERDISTRITAL':'Colectora Interdistrital',
                'ARTERIALES':'Arterial',
                'EXPRESA SUB REGIONAL':'Expresa Subregional',
                'EXPRESA METROPOLITANA':'Expresa Metropolitana',
                'EXPRESA NACIONAL-REGIONAL':'Expresa Nacional'},      
    
    colorBorde:'#555', grosor:1, defecto:'#cfd8dc'
  },


  ZONIFI:{
    campo:'simb_zoni',
    colores:{ 'ZDM':'#ff9900', 
              'ZRP':'#afc987', 
              'ZDB-C':'#9e9405', 
              'ZDA':'#eb1010', 
              'ZRE-tr1':'#717171',
              'ZRE-tr3':'#39806f',
              'E1':'#c0e0f4',
              'OU':'#adadad',
              'I1':'#d7c7e1',
              'I2':'#a8a2db',
              'ZDB':'#ffff4b',
              'ZRP-A':'#6da78f',
              'ZP':'#201f20',
              'ZPA':'#1bcece',
              'ZDMB':'#feffcd',
              'ZRE-A':'#3c2b44',
              'H1':'#add7d8',
              'ZDMA':'#730805',
              'H2':'#87cdd3',
              'I3':'#635882',
              'ZRE-tr4':'#6db6c6',
              'E2':'#8ec2e7',
              'H3':'#72b9bb'
             },

    etiquetas:{ 'ZDM':'Zona de Densidad Media', 
              'ZRP':'Zona de Recreación Pública', 
              'ZDB-C':'Zona de Densidad Baja Condicionada', 
              'ZDA':'Zona de Densidad Alta', 
              'ZRE-tr1':'Zona de Reglamentación Especial - Riesgo',
              'ZRE-tr3':'Zona de Reglamentación Especial - Recuperacion Suelo agricola',
              'E1':'Educación Básica',
              'OU':'Otros Usos',
              'I1':'Industria Elemental ',
              'I2':'Industria Liviana',
              'ZDB':'Zona de Densidad Baja',
              'ZRP-A':'Zona de Recreación Pública - Amortiguamiento',
              'ZP':'Zona Expuesta a Peligros',
              'ZPA':'Zona de Protección Ambiental',
              'ZDMB':'Zona de Densidad Muy Baja',
              'ZRE-A':'Zonas Arqueológicas',
              'H1':'Posta Medica',
              'ZDMA':'Zona de Densidad Muy Alta',
              'H2':'Centro de Salud',
              'I3':'Gran Industria',
              'ZRE-tr4':'Zona de Reglamentación Especial, mitigacion ambiental',
              'E2':'Educación Superior Tecnológica',
              'H3':'Hospital General' },

    colorBorde:'#000000', grosor:1, defecto:'#cfd8dc'
  },

  VIAS_LOCAL:{ color:'#F72C05', grosor:3, relleno:false, discontinua:'6 6'},

  VIAS_LOCAL091:{ color:'#0721E8', grosor:3, relleno:false},

  VIAS_LAGRAMA:{ color:'#FAE60A', grosor:3, relleno:false, discontinua:'6 6'},

  VIAS_HUAMANTANGA:{ color:'#F202EF', colorBorde:'#FFFFFF', grosor:2, relleno:true},

  SIT_ARQ:{ color:'#b110e284', colorBorde:'#050505fe', grosor:2, relleno:true, discontinua:'6 6'},

  SERVIDUMBRE:{ color:'#0a02f282', colorBorde:'#fb0606', grosor:2, relleno:true},

  AREA_CR:{ color:'#0aff066f', colorBorde:'#3bfc06', grosor:2, relleno:true, discontinua:'6 6'},

  ZR_NOMIT:{ color:'#f877068f', colorBorde:'#f78e04', grosor:2, relleno:true, discontinua:'6 6'},
  
  FAJA_MARGINAL:{ color:'#09b2f589', colorBorde:'#043fe1', grosor:2, relleno:true, discontinua:'6 6'},

  CONCESION:{ color:'#a6fe029e', colorBorde:'#eb9f07', grosor:2, relleno:true},

  SUB_CLAS_SUELO:{
    campo:'NOMBRE',
    colores:{ 'Urbano en Consolidación':'#fc911fb9', 
              'Urbanizable Condicionado':'#a8086591', 
              'Urbano Consolidado':'#faea989d', 
              'Urbanizable Inmediato':'#ff0a708f', 
              'Expuesto a Peligros':'#0d0d4d86',
              'Conservación':'#a8a8a886'},

    etiquetas:{ 'Urbano en Consolidación':'Urbano en Consolidación', 
                'Urbanizable Condicionado':'Urbanizable Condicionado',
                'Urbano Consolidado':'Urbano Consolidado', 
                'Urbanizable Inmediato':'Urbanizable Inmediato', 
                'Expuesto a Peligros':'Expuesto a Peligros',
                'Conservación':'Conservación',
               },

    colorBorde:'#090909', grosor:2, defecto:'#cfd8dc'
  },

  CLAS_SUELO:{
    campo:'tipo',
    colores:{ 'SUELO DE CONSERVACIÓN':'#1d2fa18d', 
              'SUELO URBANIZABLE':'#f7d9928e', 
              'SUELO URBANO':'#f27a118c' },

    etiquetas:{ 'SUELO DE CONSERVACIÓN':'SUELO DE CONSERVACIÓN', 
              'SUELO URBANIZABLE':'SUELO URBANIZABLE', 
              'SUELO URBANO':'SUELO URBANO' },

    colorBorde:'#555', grosor:1, defecto:'#cfd8dc'
  },

  OP_URBANA:{ color:'#543304a6', colorBorde:'#eb9f07', grosor:2, relleno:true},

  CON_ING:{ color:'#543304a6', colorBorde:'#000000', grosor:2, relleno:true},
  TECFLUSAC:{ color:'#14f708', colorBorde:'#ff0505', grosor:2, relleno:true},
  CON_RING:{ color:'#29ff3b', colorBorde:'#000000', grosor:2, relleno:true},
  SEDAPAL:{ color:'#00f2f2', colorBorde:'#000000', grosor:2, relleno:true},
  CON_ESPERANZA:{ color:'#d707f7', colorBorde:'#000000', grosor:2, relleno:true},

// Por rangos numéricos: colores según la columna AREA_M2
  lotesPorArea:{
    campo:'AREA_M2',
    rangos:[
      { hasta:120, color:'#fde68a', etiqueta:'Hasta 120 m²' },
      { hasta:300, color:'#f59e0b', etiqueta:'120 – 300 m²' },
      {            color:'#b45309', etiqueta:'Más de 300 m²' }
    ],
    colorBorde:'#6b7280', grosor:1
  },

// Puntos: círculos naranjas con borde blanco
  puntos:{ color:'#d9822b', colorBorde:'#ffffff', grosor:2, radio:7 },

// Línea de trazos (ej. vías en proyecto)
  proyecto:{ color:'#e11d48', grosor:3, relleno:false, discontinua:'8 6' }
};



const POPUPS = {
  // Funciona con el archivo de ejemplo limite_distrital.geojson (columnas NOMBRE, CODIGO, AREA_KM2)
  COFOPRI:{
    titulo:'COFOPRI',
    campos:[ { campo:'AMBITO', etiqueta:'Nombre' },
             { campo:'SECTOR', etiqueta:'Sector'},
             { campo:'PARTIDA_R', etiqueta:'Partida Registral'},
             { campo:'PLANO', etiqueta:'Plano', enlace:true, texto:'Ver Plano'}],
    pie:'Subgerencia de Saneamiento y Catastro'
  },
   HAB_URBANA:{
    titulo:'Habilitación Urbana',
    campos:[ { campo:'AMBITO', etiqueta:'Nombre' },
             { campo:'SECTOR', etiqueta:'Sector'},
             { campo:'PARTIDA_R', etiqueta:'Partida Registral'},
             { campo:'TIPO', etiqueta:'Tipo'},
             { campo:'PROCESO', etiqueta:'Estado'},
             { campo:'ANIO', etiqueta:'Año'},
             { campo:'PLANO', etiqueta:'Plano', enlace:true, texto:'Ver Plano'}],
    pie:'Subgerencia de Saneamiento y Catastro'
  },
   ORD_038:{
    titulo:'Ordenanza N.º038',
    campos:[ { campo:'AMBITO', etiqueta:'Nombre' },
             { campo:'SECTOR', etiqueta:'Sector'},
             { campo:'ANIO', etiqueta:'Año'},
             { campo:'PLANO', etiqueta:'Plano', enlace:true, texto:'Ver Plano'}],
    pie:'Subgerencia de Saneamiento y Catastro'
  },

  P_RUSTICA:{
    titulo:'Parcelación Semirustica',
    campos:[ { campo:'NOMBRE', etiqueta:'Nombre' },
             { campo:'SECTOR', etiqueta:'Sector'},
             { campo:'PLANO', etiqueta:'Plano', enlace:true, texto:'Ver Plano'}],
    pie:'Subgerencia de Saneamiento y Catastro'
  },

  SECTOR:{
    titulo:'Sectores',
    campos:[ { campo:'NOMBRE', etiqueta:'Sector'}],
    pie:'Subgerencia de Saneamiento y Catastro'
  },

  ZONAS:{
    titulo:'Zonas Distritales',
    campos:[ { campo:'RefName', etiqueta:'Nombre' }],
            pie:'Subgerencia de Saneamiento y Catastro'
  },

  VIAS_MET:{
    titulo:'Vias Metropolitanas',
    campos:[ { campo:'nombre', etiqueta:'Nombre'},
             { campo:'clasif', etiqueta:'Clasificación'},
             { campo:'cod_secc', etiqueta:'Codigo'},
             { campo:'Ancho_V', etiqueta:'Ancho Normativo'},
             { campo:'tramo_vial', etiqueta:'Tramo'},
             { campo:'nomb_secc', etiqueta:'Sección'}
    ],
            pie:'Subgerencia de Saneamiento y Catastro'
  },

   VIAS_LOCAL:{
    titulo:'Vias locales',
    campos:[ { campo:'NOMBRE_VIA', etiqueta:'Nombre'},
             { campo:'ANCHO_VIAL', etiqueta:'Ancho Normativo'},
             { campo:'SECC_VIAL', etiqueta:'Sección Vial'} ],

            pie:'Subgerencia de Saneamiento y Catastro'
  },

   VIAS_LOCAL091:{
    titulo:'Vias Ordenanza N.º091',
    campos:[ { campo:'Layer', etiqueta:'Nombre de Via'},
             { campo:'Ancho_Norm', etiqueta:'Ancho Normativo'} ],

            pie:'Subgerencia de Saneamiento y Catastro'
  },

  VIAS_LAGRAMA:{
    titulo:'Vias La Grama',
    campos:[ { campo:'NOMBRE', etiqueta:'Nombre'},
             { campo:'SECCION', etiqueta:'Sección Vial'},
             { campo:'ANCHO', etiqueta:'Ancho Normativo'} ],

            pie:'Subgerencia de Saneamiento y Catastro'
  },

  VIAS_HUAMANTANGA:{
    titulo:'Vias la Cumbre - Huamantanga',
    campos:[ { campo:'RefName', etiqueta:'Nombre'},
             { campo:'SECCION', etiqueta:'Sección Vial'},
             { campo:'CODIGO', etiqueta:'Codigo'} ],

            pie:'Subgerencia de Saneamiento y Catastro'
  },

  ZONIFI:{
    titulo:'Zonificación PDU Lima Norte',
    campos:[ { campo:'simb_zoni', etiqueta:'Simbolo'},
             { campo:'sclas_zoni', etiqueta:'Descripción'} ],

            pie:'Subgerencia de Saneamiento y Catastro'
  },

  SUB_CLAS_SUELO:{
    titulo:'Subclasificación de Suelos',
    campos:[ { campo:'NOMBRE', etiqueta:'Categoria'} ],

            pie:'Subgerencia de Saneamiento y Catastro'
  },

  CLAS_SUELO:{
    titulo:'Clasificación de Suelos',
    campos:[ { campo:'tipo', etiqueta:'Descripción'} ],

            pie:'Subgerencia de Saneamiento y Catastro'
  },

  OP_URBANA:{
    titulo:'Operaciones Urbanas',
    campos:[ { campo:'Nombre', etiqueta:'Tipo'} ],

            pie:'Subgerencia de Saneamiento y Catastro'
  },

  SIT_ARQ:{
    titulo:'Sitios Arqueológicos',
    campos:[ { campo:'NOMBRE', etiqueta:'Nombre'},
             { campo:'CATEGORIA', etiqueta:'Categoria'}],

            pie:'Subgerencia de Saneamiento y Catastro'
  },

  CONCESION:{
    titulo:'Concesiones Mineras',
    campos:[ { campo:'NOMBRE', etiqueta:'Nombre'},
             { campo:'CODIGO', etiqueta:'Código'},
            { campo:'ESTADO', etiqueta:'Estado'}],

            pie:'Subgerencia de Saneamiento y Catastro'
  },

   CON_ING:{
    titulo:'Consorcio Ingenieria',
    campos:[ { campo:'EJECUTOR', etiqueta:'Ejecutor'},
             { campo:'PROYECTO', etiqueta:'Proyecto'},
             { campo:'CUI', etiqueta:'CUI'},
             { campo:'PLAZO_EJEC', etiqueta:'Plazo de Ejecución'},
             { campo:'ALCANCE', etiqueta:'Alcance'},
             { campo:'BENEFICIAR', etiqueta:'Beneficiarios'},
             { campo:'MONTO', etiqueta:'Monto'},
             { campo:'ETAPA', etiqueta:'Etapa'},
             { campo:'PUEBLOS', etiqueta:'N.º de Pueblos'},
             { campo:'LOTES_BEN', etiqueta:'Lotes Beneficiarios'},
             { campo:'SITUACION', etiqueta:'Estado'},      
           ],

            pie:'Subgerencia de Saneamiento y Catastro'
  },

    TECFLUSAC:{
     titulo:'TECFLUSAC',
     campos:[ { campo:'EJECUTOR', etiqueta:'Ejecutor'},
             { campo:'PROYECTO', etiqueta:'Proyecto'},
             { campo:'CUI', etiqueta:'CUI'},
             { campo:'PLAZO_EJEC', etiqueta:'Plazo de Ejecución'},
             { campo:'ALCANCE', etiqueta:'Alcance'},
             { campo:'BENEFICIAR', etiqueta:'Beneficiarios'},
             { campo:'MONTO', etiqueta:'Monto'},
             { campo:'ETAPA', etiqueta:'Etapa'},
             { campo:'PUEBLOS', etiqueta:'N.º de Pueblos'},
             { campo:'LOTES_BEN', etiqueta:'Lotes Beneficiarios'},
             { campo:'SITUACION', etiqueta:'Estado'},      
           ],

            pie:'Subgerencia de Saneamiento y Catastro'
  },

   CON_RING:{
     titulo:'Consorcio REMA - Ingenieria',
     campos:[ { campo:'EJECUTOR', etiqueta:'Ejecutor'},
             { campo:'PROYECTO', etiqueta:'Proyecto'},
             { campo:'CUI', etiqueta:'CUI'},
             { campo:'PLAZO_EJEC', etiqueta:'Plazo de Ejecución'},
             { campo:'ALCANCE', etiqueta:'Alcance'},
             { campo:'BENEFICIAR', etiqueta:'Beneficiarios'},
             { campo:'MONTO', etiqueta:'Monto'},
             { campo:'ETAPA', etiqueta:'Etapa'},
             { campo:'PUEBLOS', etiqueta:'N.º de Pueblos'},
             { campo:'LOTES_BEN', etiqueta:'Lotes Beneficiarios'},
             { campo:'SITUACION', etiqueta:'Estado'},      
           ],

            pie:'Subgerencia de Saneamiento y Catastro'
  },

   SEDAPAL:{
     titulo:'SEDAPAL',
     campos:[ { campo:'EJECUTOR', etiqueta:'Ejecutor'},
             { campo:'PROYECTO', etiqueta:'Proyecto'},
             { campo:'CUI', etiqueta:'CUI'},
             { campo:'PLAZO_EJEC', etiqueta:'Plazo de Ejecución'},
             { campo:'ALCANCE', etiqueta:'Alcance'},
             { campo:'BENEFICIAR', etiqueta:'Beneficiarios'},
             { campo:'MONTO', etiqueta:'Monto'},
             { campo:'ETAPA', etiqueta:'Etapa'},
             { campo:'PUEBLOS', etiqueta:'N.º de Pueblos'},
             { campo:'LOTES_BEN', etiqueta:'Lotes Beneficiarios'},
             { campo:'SITUACION', etiqueta:'Estado'},      
           ],

            pie:'Subgerencia de Saneamiento y Catastro'
  },

   CON_ISAIAS:{
     titulo:'Consorcio ISAIAS',
     campos:[ { campo:'EJECUTOR', etiqueta:'Ejecutor'},
             { campo:'PROYECTO', etiqueta:'Proyecto'},
             { campo:'CUI', etiqueta:'CUI'},
             { campo:'PLAZO_EJEC', etiqueta:'Plazo de Ejecución'},
             { campo:'ALCANCE', etiqueta:'Alcance'},
             { campo:'BENEFICIAR', etiqueta:'Beneficiarios'},
             { campo:'MONTO', etiqueta:'Monto'},
             { campo:'ETAPA', etiqueta:'Etapa'},
             { campo:'PUEBLOS', etiqueta:'N.º de Pueblos'},
             { campo:'LOTES_BEN', etiqueta:'Lotes Beneficiarios'},
             { campo:'SITUACION', etiqueta:'Estado'},      
           ],

            pie:'Subgerencia de Saneamiento y Catastro'
  },

   CON_ESPERANZA:{
     titulo:'Consorcio ESPERANZA',
     campos:[ { campo:'EJECUTOR', etiqueta:'Ejecutor'},
             { campo:'PROYECTO', etiqueta:'Proyecto'},
             { campo:'CUI', etiqueta:'CUI'},
             { campo:'PLAZO_EJEC', etiqueta:'Plazo de Ejecución'},
             { campo:'ALCANCE', etiqueta:'Alcance'},
             { campo:'BENEFICIAR', etiqueta:'Beneficiarios'},
             { campo:'MONTO', etiqueta:'Monto'},
             { campo:'ETAPA', etiqueta:'Etapa'},
             { campo:'PUEBLOS', etiqueta:'N.º de Pueblos'},
             { campo:'LOTES_BEN', etiqueta:'Lotes Beneficiarios'},
             { campo:'SITUACION', etiqueta:'Estado'},      
           ],

            pie:'Subgerencia de Saneamiento y Catastro'
  },

  // Para lotes: ficha con códigos traducidos y área con formato
  lote:{
    titulo:'Lote {COD_LOTE}',
    campos:[ { campo:'DIRECCION', etiqueta:'Dirección' },
             { campo:'USO', etiqueta:'Uso', mapa:{ V:'Vivienda', C:'Comercio', E:'Equipamiento' } },
             { campo:'AREA_M2', etiqueta:'Área', decimales:1, sufijo:' m²' },
             { campo:'FICHA', enlace:true, texto:'Ver ficha catastral', etiqueta:'Ficha' } ],
    ancho:320
  },

  // Ejemplo de control total con HTML propio (usa esc() para los textos)
  zona:{
    html: p => '<div class="pu"><h4 class="pu-t">' + esc(p.ZONA) + '</h4>' +
               '<div>' + esc(p.DESCRIPCION || 'Sin descripción') + '</div></div>'
  }
};


const CATEGORIAS = [
 
  { id:'ambitos', nombre:'Ámbitos urbanos', color:'#7a3db8', nivel:1, s:.05, p:.8, capas:[
    //{ n:'Límite provincial',    estilo:{ color:'#7a3db8', grosor:3, relleno:false, discontinua:'6 5' } },

    // CAPA COFOPRI
    { n:'COFOPRI', 
      f:'data/COFOPRI-PY.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      buscar:['AMBITO'], 
      estilo:ESTILOS.COFOPRI, 
      popup:POPUPS.COFOPRI },
    
    // CAPA HAB URBAN
    { n:'Habilitación', 
      f:'data/HAB_URBANA.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      buscar:['AMBITO'], 
      estilo:ESTILOS.HAB_URBANA, 
      popup:POPUPS.HAB_URBANA },
    
    // CAPA ORDENANZA N.º38
    { n:'Ordenanza N°038', 
      f:'data/ORD_038.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      buscar:['AMBITO'], 
      estilo:ESTILOS.ORD_038, 
      popup:POPUPS.ORD_038 },
    
    // CAPA PARCELACION RUSTICA
    { n:'Parcelación', 
      f:'data/P_RUSTICA.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      buscar:['NOMBRE'], 
      estilo:ESTILOS.P_RUSTICA, 
      popup:POPUPS.P_RUSTICA }]},

  { id:'sectores', nombre:'Sectores', color:'#d9822b', nivel:2, s:.02, p:.5, capas:[
    
    // CAPA SECTORES
    { n:'Sectores', 
      f:'data/SECTOR.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
     estilo:ESTILOS.SECTOR, 
     popup:POPUPS.SECTOR },

    // CAPA ZONAS DISTRITALES
    { n:'Zonas', 
      f:'data/ZONAS.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      buscar:['AMBITO'], 
      estilo:ESTILOS.ZONAS, 
      popup:POPUPS.SECTOR }]},

  { id:'vias', nombre:'Vías', color:'#3366cc', nivel:3, s:.015, p:.45, capas:[
    // Ejemplo de zonificación (colores por categoría, con búsqueda por zona):
    // { n:'Zonificación', f:'data/zonificacion.geojson', fecha:'2026-11-01', buscar:['ZONA'],
    //   estilo:ESTILOS.zonificacion, popup:POPUPS.zona },

    //CAPA DE VIAS METROPOLITANAS 2025
    { n:'Vías Metropolitanas', 
      f:'data/VIAS_MET.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      buscar:['AMBITO'], 
      estilo:ESTILOS.VIAS_MET, 
      popup:POPUPS.VIAS_MET },

    //CAPA DE VIAS LOCALES
    { n:'Vías Locales', 
      f:'data/VIAS_LOCAL.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
     estilo:ESTILOS.VIAS_LOCAL, 
     popup:POPUPS.VIAS_LOCAL },

    //CAPA DE VIAS LOCALES 091
    { n:'Vías Ordenanza N.°091', 
      f:'data/VIAS_LOCAL091.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      estilo:ESTILOS.VIAS_LOCAL091, 
      popup:POPUPS.VIAS_LOCAL091 },

    //CAPA DE VIAS LOCALES HUAMANTANGA
    { n:'Via La Cumbre Sr Huamantanga', 
      f:'data/VIAS_HUAMANTAGA.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
     estilo:ESTILOS.VIAS_HUAMANTANGA, 
     popup:POPUPS.VIAS_HUAMANTAGA },

    //CAPA DE VIAS LOCALES LA GRAMA
    { n:'Vias Locales - La Grama', 
      f:'data/VIAS_LAGRAMA.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
     estilo:ESTILOS.VIAS_LAGRAMA, 
     popup:POPUPS.VIAS_LAGRAMA }
    ]},

  { id:'normativa', nombre:'Información Normativa', color:'#2a9d8f', nivel:4, s:.008, p:.35, capas:[
    
    //SITIOS ARQUEOLÓGICOS
    { n:'Sitios Arqueológicos', 
      f:'data/SIT_ARQ.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      estilo:ESTILOS.SIT_ARQ, 
      popup:POPUPS.SIT_ARQ },
      
    //ZONIFICACION
    { n:'Zonificación 2025', 
      f:'data/ZONIFI.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      estilo:ESTILOS.ZONIFI, 
      popup:POPUPS.ZONIFI },

    //AREAS DE SERVIDUMBRE
    { n:'Área de Servidumbre', 
      f:'data/SERVIDUMBRE.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      estilo:ESTILOS.SERVIDUMBRE, 
      popup:POPUPS.SERVIDUMBRE },

    //ÁREAS DE CONSERVACION REGIONAL
    { n:'Área de Conservacion Regional', 
      f:'data/AREA_CR.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      estilo:ESTILOS.AREA_CR, 
      popup:POPUPS.AREA_CR },

    //ZONA DE RIESGO NO MITIGABLE
    { n:'Zona de Riesgo No Mitigable', 
      f:'data/ZR_NOMIT.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      estilo:ESTILOS.ZR_NOMIT, 
      popup:POPUPS.ZR_NOMIT },

    //FAJA MARGINAL DEL RIO CHILLON
    { n:'Faja Marginal del Rio Chillón', 
      f:'data/FAJA_MARGINAL.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      estilo:ESTILOS.FAJA_MARGINAL, 
      popup:POPUPS.FAJA_MARGINAL },

    //CONCESIONES MINERAS
    { n:'Concesiones Mineras', 
      f:'data/CONCESION.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      estilo:ESTILOS.CONCESION, 
      popup:POPUPS.CONCESION }
    ]},

  { id:'tematica', nombre:'Información Temática', color:'#EB0E0E', nivel:5, s:.008, p:.35, capas:[
    
    //SUBCLASIFICACION SUELO
    { n:'Subclasificación de Suelos', 
      f:'data/SUB_CLAS_SUELO.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      estilo:ESTILOS.SUB_CLAS_SUELO, 
      popup:POPUPS.SUB_CLAS_SUELO },

    //CLASIFICACION SUELO
    { n:'Clasificación de Suelos', 
      f:'data/CLAS_SUELO.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      estilo:ESTILOS.CLAS_SUELO, 
      popup:POPUPS.CLAS_SUELO },

    //OPERACIONES URBANAS
    { n:'Operaciones Urbanas', 
      f:'data/OP_URBANA.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      estilo:ESTILOS.OP_URBANA, 
      popup:POPUPS.OP_URBANA },
    
    ]},

{ id:'proyectos', nombre:'Proyectos de Agua y Alcantarillado', color:'#0086ED', nivel:6, s:.008, p:.35, capas:[
    
    //CONSORCIO INGENIERIA
    { n:'Consorcio Ingenieria', 
      f:'data/CON_ING.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      estilo:ESTILOS.CON_ING, 
      popup:POPUPS.CON_ING },
      
    //TECFLUSAC
    { n:'TECFLUSAC', 
      f:'data/TECFLUSAC.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      estilo:ESTILOS.TECFLUSAC, 
      popup:POPUPS.TECFLUSAC },

    //CONSORCIO REMA - INGENIERIA
    { n:'Consorcio Rema Ingenieria', 
      f:'data/CON_RING.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      estilo:ESTILOS.CON_RING, 
      popup:POPUPS.CON_RING },

    //SEDAPAL
    { n:'SEDAPAL', 
      f:'data/SEDAPAL.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      estilo:ESTILOS.SEDAPAL, 
      popup:POPUPS.SEDAPAL },

    //CONSORCIO ISAIAS
    { n:'Consorcio Isaias', 
      f:'data/CON_ISAIAS.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      estilo:ESTILOS.CON_ISAIAS, 
      popup:POPUPS.CON_ISAIAS },

    //CONSORCIO ESPERANZA
    { n:'Consorcio Esperanza', 
      f:'data/CON_ESPERANZA.geojson', 
      fuente:'Municipalidad', 
      escala:'1:25 000', 
      fecha:'2026-11-01',
      estilo:ESTILOS.CON_ESPERANZA, 
      popup:POPUPS.CON_ESPERANZA }
    ]}];

 // { id:'tematica', nombre:'Información Temática', color:'#c0392b', nivel:5, s:.003, p:.25, capas:[
    // Ejemplo de una capa pesada, coloreada por área, con su ficha y búsqueda por código de lote:
    // { n:'Lotes catastrales', f:'data/lotes.geojson', z:15, fecha:'2026-11-01',
    //   buscar:['COD_LOTE'], estilo:ESTILOS.lotesPorArea, popup:POPUPS.lote },
    //'Lotes COFOPRI', 'Lotes HAB. URBANA', 'Lotes ORD. 038', 'Lotes Rusticos']}

