export const es = {
  notifications: {
    categories: {
      general: "General",
      tasks: "Tareas",
      resumes: "Resúmenes",
    },
    types: {
      task_assigned: {
        title: "Tarea asignada",
        description: "Notificarme cuando se me asigne una tarea.",
      },
      resume_generated: {
        title: "Resumen generado",
        description: "Notificarme cuando se genere un resumen para mi equipo.",
      },
      task_column_changed: {
        title: "Tarea movida",
        description: "Notificarme cuando una tarea se mueva a otra columna.",
      },
      task_comment: {
        title: "Nuevo comentario en la tarea",
        description: "Notificarme cuando alguien comente una tarea.",
      },
    },
    channels: {
      in_app: "En la aplicación",
      email: "Correo electrónico",
      mattermost: "Mattermost",
    },
  },
  activities: {
    changes: {
      title: "Título",
      dueDate: "Fecha límite",
      columnId: "Columna",
      assigneeId: "Responsable",
      description: "Descripción",
    },
  },
  forms: {
    teamForm: {
      name: {
        label: "Nombre",
      },
      email: {
        label: "Correo electrónico",
      },
      locale: {
        label: "Idioma",
        placeholder: "Selecciona un idioma",
      },
      timezone: {
        label: "Zona horaria",
        placeholder: "Selecciona una zona horaria",
      },
      description: {
        label: "Descripción",
        placeholder: "ACME es una empresa que se especializa en...",
      },
    },
    memberInviteForm: {
      email: {
        label: "Correo electrónico",
      },
      submitButton: {
        label: "Enviar invitación",
      },
    },
    resumeSettingsForm: {
      enabled: {
        label: "Habilitar generación de resúmenes",
      },
      cronPrompt: {
        label: "¿Cuándo quieres recibir el resumen?",
        description:
          'Describe en lenguaje natural cuándo quieres recibir el resumen. Por ejemplo: "Todos los lunes a las 9:00" o "El primer día de cada mes a las 8:00".',
      },
      instructions: {
        label: "Instrucciones",
      },
      alert: {
        description: "Ten en cuenta que tu próximo resumen no se generará hoy",
      },
      submitButton: {
        label: "Guardar configuración",
      },
      testButton: {
        label: "Probar configuración",
      },
    },
  },
  settings: {
    general: {
      team: {
        title: "Configuración del equipo",
      },
    },
    members: {
      invite: {
        description:
          "Invita nuevos miembros a tu equipo por correo electrónico.",
      },
      membersList: {
        title: "Miembros",
      },
      pendingInvites: {
        title: "Invitaciones pendientes",
      },
    },
    labels: {
      title: "Etiquetas",
      description: "Gestiona las etiquetas de tus tareas.",
      table: {
        name: "Nombre",
        tasks: "Tareas",
        createdAt: "Creado el",
      },
      actions: {
        edit: "Editar",
        delete: "Eliminar",
      },
    },
    notifications: {
      description: "Configura tus preferencias de notificaciones aquí.",
    },
    resumes: {
      description: "Configura tu resumen aquí.",

      activity: {
        title: "Actividad",
      },
    },
    integrations: {
      title: "Integraciones",
      github: {
        description: "Integración con Github",
      },
      mattermost: {
        description: "Plataforma de mensajería de código abierto",
      },
    },
    import: {
      tasks: {
        title: "Importar tareas",
        description:
          "Importa tareas desde un archivo CSV. Asegúrate de que tu archivo CSV esté formateado correctamente.",

        table: {
          fileName: "Nombre de archivo",
          status: "Estado",
          uploadedAt: "Subido el",
        },
      },
    },
    sidebar: {
      general: "General",
      billing: "Facturación",
      members: "Miembros",
      labels: "Etiquetas",
      notifications: "Notificaciones",
      resumes: "Resúmenes",
      integrations: "Integraciones",
      import: "Importar",
    },
  },
};
