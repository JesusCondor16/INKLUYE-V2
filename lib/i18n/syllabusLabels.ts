export type SyllabusLang = 'es' | 'en' | 'zh';

type LabelKey =
  | 'universidad' | 'universidadSub' | 'facultad' | 'escuela' | 'silabo'
  | 's1Titulo' | 's1Nombre' | 's1Codigo' | 's1Tipo' | 's1Area' | 's1Semanas'
  | 's1Horas' | 's1Semestre' | 's1Ciclo' | 's1Creditos' | 's1Modalidad'
  | 's1Prerrequisitos' | 's1Docentes' | 'ninguno' | 'noAsignados'
  | 's2Titulo'
  | 's3Titulo' | 's3Vacio' | 's3ColCodigo' | 's3ColDescripcion' | 's3ColTipo' | 's3ColNivel'
  | 's4Titulo' | 's4Frase' | 's4Vacio'
  | 's5Titulo' | 's5Vacio'
  | 's6Titulo' | 's6Vacio' | 's6ColSesion' | 's6ColContenido' | 's6ColActividades' | 's6ColRecursos' | 's6ColEstrategias'
  | 's7Titulo' | 's7Vacio'
  | 's8Titulo' | 's8Vacio'
  | 's9Titulo' | 's9Vacio' | 's9ColUnidad' | 's9ColCriterios' | 's9ColProducto' | 's9ColInstrumento' | 's9ColPeso' | 's9ColSum'
  | 's10Titulo' | 's10Vacio'
  | 'filenamePrefix';

export const syllabusLabels: Record<LabelKey, Record<SyllabusLang, string>> = {
  universidad: { es: 'UNIVERSIDAD NACIONAL MAYOR DE SAN MARCOS', en: 'UNIVERSIDAD NACIONAL MAYOR DE SAN MARCOS', zh: 'UNIVERSIDAD NACIONAL MAYOR DE SAN MARCOS' },
  universidadSub: { es: '(Universidad del Perú, DECANA DE AMÉRICA)', en: '(University of Peru, DEAN OF AMERICA)', zh: '（秘鲁大学，美洲第一学府）' },
  facultad: { es: 'FACULTAD DE INGENIERÍA DE SISTEMAS E INFORMÁTICA', en: 'FACULTY OF SYSTEMS AND COMPUTER ENGINEERING', zh: '系统与信息工程学院' },
  escuela: { es: 'ESCUELA PROFESIONAL DE INGENIERÍA DE SOFTWARE', en: 'PROFESSIONAL SCHOOL OF SOFTWARE ENGINEERING', zh: '软件工程专业学院' },
  silabo: { es: 'SÍLABO', en: 'SYLLABUS', zh: '教学大纲' },

  s1Titulo: { es: '1. INFORMACIÓN GENERAL', en: '1. GENERAL INFORMATION', zh: '1. 基本信息' },
  s1Nombre: { es: '1.1 Nombre de la asignatura', en: '1.1 Course Name', zh: '1.1 课程名称' },
  s1Codigo: { es: '1.2 Código de la asignatura', en: '1.2 Course Code', zh: '1.2 课程代码' },
  s1Tipo: { es: '1.3 Tipo de Asignatura', en: '1.3 Course Type', zh: '1.3 课程类型' },
  s1Area: { es: '1.4 Área de Estudios', en: '1.4 Field of Study', zh: '1.4 学科领域' },
  s1Semanas: { es: '1.5 Número de semanas', en: '1.5 Number of Weeks', zh: '1.5 周数' },
  s1Horas: { es: '1.6 Horas semanales', en: '1.6 Weekly Hours', zh: '1.6 每周课时' },
  s1Semestre: { es: '1.7 Semestre Académico', en: '1.7 Academic Semester', zh: '1.7 学期' },
  s1Ciclo: { es: '1.8 Ciclo', en: '1.8 Cycle', zh: '1.8 学年周期' },
  s1Creditos: { es: '1.9 Créditos', en: '1.9 Credits', zh: '1.9 学分' },
  s1Modalidad: { es: '1.10 Modalidad', en: '1.10 Mode of Instruction', zh: '1.10 授课方式' },
  s1Prerrequisitos: { es: '1.11 Prerrequisitos', en: '1.11 Prerequisites', zh: '1.11 先修课程' },
  s1Docentes: { es: '1.12 Docentes', en: '1.12 Instructors', zh: '1.12 授课教师' },
  ninguno: { es: 'Ninguno', en: 'None', zh: '无' },
  noAsignados: { es: 'No asignados', en: 'Not assigned', zh: '未分配' },

  s2Titulo: { es: '2. SUMILLA:', en: '2. COURSE DESCRIPTION:', zh: '2. 课程简介：' },

  s3Titulo: { es: '3. COMPETENCIAS', en: '3. COMPETENCIES', zh: '3. 能力目标' },
  s3Vacio: { es: 'No hay competencias registradas para este curso.', en: 'No competencies have been registered for this course.', zh: '本课程尚未登记能力目标。' },
  s3ColCodigo: { es: 'Código', en: 'Code', zh: '代码' },
  s3ColDescripcion: { es: 'Descripción', en: 'Description', zh: '描述' },
  s3ColTipo: { es: 'Tipo', en: 'Type', zh: '类型' },
  s3ColNivel: { es: 'Nivel', en: 'Level', zh: '级别' },

  s4Titulo: { es: '4. LOGROS DE APRENDIZAJE', en: '4. LEARNING OUTCOMES', zh: '4. 学习成果' },
  s4Frase: { es: 'Al finalizar la asignatura, el estudiante:', en: 'By the end of the course, the student will be able to:', zh: '课程结束时，学生应能够：' },
  s4Vacio: { es: 'No hay logros registrados para este curso.', en: 'No learning outcomes have been registered for this course.', zh: '本课程尚未登记学习成果。' },

  s5Titulo: { es: '5. CAPACIDADES (Logros por unidad)', en: '5. CAPABILITIES (Unit Learning Outcomes)', zh: '5. 能力（单元学习成果）' },
  s5Vacio: { es: 'No hay capacidades registradas para este curso.', en: 'No capabilities have been registered for this course.', zh: '本课程尚未登记能力信息。' },

  s6Titulo: { es: '6. PROGRAMACIÓN DE CONTENIDOS', en: '6. CONTENT SCHEDULE', zh: '6. 内容编排' },
  s6Vacio: { es: 'No hay programación de contenidos registrada para este curso.', en: 'No content schedule has been registered for this course.', zh: '本课程尚未登记内容编排。' },
  s6ColSesion: { es: 'Sesión', en: 'Session', zh: '课次' },
  s6ColContenido: { es: 'Contenido', en: 'Content', zh: '内容' },
  s6ColActividades: { es: 'Actividades', en: 'Activities', zh: '活动' },
  s6ColRecursos: { es: 'Recursos', en: 'Resources', zh: '资源' },
  s6ColEstrategias: { es: 'Estrategias', en: 'Strategies', zh: '策略' },

  s7Titulo: { es: '7. ESTRATEGIA DIDÁCTICA', en: '7. TEACHING STRATEGY', zh: '7. 教学策略' },
  s7Vacio: { es: 'No hay estrategias didácticas registradas para este curso.', en: 'No teaching strategies have been registered for this course.', zh: '本课程尚未登记教学策略。' },

  s8Titulo: { es: '8. RECURSOS', en: '8. RESOURCES', zh: '8. 资源' },
  s8Vacio: { es: 'No hay recursos registrados para este curso.', en: 'No resources have been registered for this course.', zh: '本课程尚未登记资源信息。' },

  s9Titulo: { es: '9. MATRIZ DE EVALUACIÓN', en: '9. EVALUATION MATRIX', zh: '9. 评价矩阵' },
  s9Vacio: { es: 'No hay registros de evaluación para este curso.', en: 'No evaluation records have been registered for this course.', zh: '本课程尚未登记评价记录。' },
  s9ColUnidad: { es: 'Unidad de aprendizaje', en: 'Learning Unit', zh: '学习单元' },
  s9ColCriterios: { es: 'Criterios y logros de aprendizaje', en: 'Criteria and Learning Outcomes', zh: '标准与学习成果' },
  s9ColProducto: { es: 'Procedimientos (Producto)', en: 'Procedures (Deliverable)', zh: '程序（成果）' },
  s9ColInstrumento: { es: 'Instrumento de Evaluación', en: 'Assessment Instrument', zh: '评估工具' },
  s9ColPeso: { es: 'Peso (%)', en: 'Weight (%)', zh: '权重 (%)' },
  s9ColSum: { es: 'SUM', en: 'SUM', zh: 'SUM' },

  s10Titulo: { es: '10. BIBLIOGRAFÍA', en: '10. BIBLIOGRAPHY', zh: '10. 参考文献' },
  s10Vacio: { es: 'No hay bibliografía registrada para este curso.', en: 'No bibliography has been registered for this course.', zh: '本课程尚未登记参考文献。' },

  filenamePrefix: { es: 'Sílabo', en: 'Syllabus', zh: '教学大纲' },
};

export function t(lang: SyllabusLang, key: LabelKey): string {
  return syllabusLabels[key]?.[lang] ?? syllabusLabels[key]?.es ?? '';
}