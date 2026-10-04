'use client';

import { Globe } from 'lucide-react';
import React from 'react';
import Sidebar from '@/components/Sidebar';
import styles from '@/styles/Informacion.module.css';
import { Sigla } from '@/components/Glosario/Glosario';

export default function InformacionPage() {
  return (
    <>
      
      <div className={styles.container}>
        {/* div y no <aside>: el Sidebar ya es un <aside> (evita regiones anidadas) */}
        <div className={styles.sidebarWrapper}>
          <Sidebar />
        </div>

        <main
          id="main-content"
          tabIndex={-1}
          className={styles.main}
          role="main"
          aria-labelledby="page-title"
        >
          <h1 id="page-title" className={styles.title}>
            <Globe size={28} aria-hidden="true" focusable={false} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Información del Sistema Inkluye
          </h1>

          <section aria-labelledby="sobre-inkluye" className={styles.section}>
            <h2 id="sobre-inkluye" className={styles.subtitle}>
              ¿Qué es Inkluye?
            </h2>

            {/* Frases cortas y palabras comunes (WCAG 2.1 - 3.1.5) */}
            <p>
              <strong>Inkluye</strong> es un sistema para manejar el syllabus de cada curso.
              Con él se prepara, se revisa y se publica el syllabus en un solo lugar.
            </p>

            <p>
              Lo usan <strong>directores</strong>, <strong>coordinadores</strong>,{' '}
              <strong>docentes</strong> y <strong>estudiantes</strong>.
              Cada uno ve solo las herramientas que necesita.
            </p>
          </section>

          <section aria-labelledby="accesibilidad" className={styles.section}>
            <h2 id="accesibilidad" className={styles.subtitle}>
              Compromiso con la accesibilidad
            </h2>

            <p>
              Inkluye sigue las pautas de accesibilidad <strong><Sigla id="wcag" /> 2.1</strong>,
              nivel <strong><Sigla id="aaa" /></strong>. Así todas las personas pueden usarlo sin barreras.
              Por ejemplo:
            </p>

            <ul className={styles.list}>
              <li>Colores con mucho contraste y letra fácil de leer.</li>
              <li>Funciona con lectores de pantalla y solo con el teclado.</li>
              <li>Títulos ordenados para encontrar rápido cada parte.</li>
              <li>Se ve claramente en qué enlace o botón está uno.</li>
            </ul>
          </section>

          <section aria-labelledby="objetivo" className={styles.section}>
            <h2 id="objetivo" className={styles.subtitle}>
              Objetivo del sistema
            </h2>

            <p>
              Hacer más fácil preparar, revisar y publicar el syllabus.
              Así todos pueden conocer cada curso, sin importar su discapacidad.
            </p>
            <p>
              ¿Hay alguna palabra que no entiende? Revise el <a href="/glosario">glosario</a>.
            </p>
          </section>

          <footer className={styles.footer}>
            <p>© {new Date().getFullYear()} Inkluye – Sistema de Gestión de Syllabus Accesible</p>
          </footer>
        </main>
      </div>
    </>
  );
}