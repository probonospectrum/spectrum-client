// Source text is the key so existing labels and API status values stay unchanged.
export const normalizeText = (value: string): string => value.trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const rows = `
Conta|Account|Cuenta
Foto de perfil|Profile photo|Foto de perfil
Alterar foto|Change photo|Cambiar foto
Adicionar foto|Add photo|Añadir foto
Alterar nome|Change name|Cambiar nombre
Alterar username|Change username|Cambiar nombre de usuario
Username|Username|Nombre de usuario
E-mail principal|Primary email|Correo principal
Idioma|Language|Idioma
Idioma usado na interface|Interface language|Idioma de la interfaz
Segurança|Security|Seguridad
Alterar senha|Change password|Cambiar contraseña
Atualizar senha da conta|Update account password|Actualizar contraseña de la cuenta
Preferências|Preferences|Preferencias
Tema claro/escuro|Light/dark theme|Tema claro/oscuro
Tema escuro ativo|Dark theme enabled|Tema oscuro activado
Tema claro ativo|Light theme enabled|Tema claro activado
Modo compacto|Compact mode|Modo compacto
Espaçamento reduzido ativo|Reduced spacing enabled|Espaciado reducido activado
Reduzir espaçamentos no feed|Reduce feed spacing|Reducir el espaciado del feed
Receber novidades|Receive news|Recibir novedades
Comunicados sobre recursos e melhorias|Updates about features and improvements|Novedades sobre funciones y mejoras
Notificações|Notifications|Notificaciones
Notificações dentro do app|In-app notifications|Notificaciones en la aplicación
Alertas enquanto você usa o Spectrum|Alerts while you use Spectrum|Alertas mientras usas Spectrum
E-mails|Emails|Correos electrónicos
Receber notificações no e-mail principal|Receive notifications at your primary email|Recibir notificaciones en tu correo principal
Atualizações importantes|Important updates|Actualizaciones importantes
Priorizar avisos de alta relevância|Prioritize important notices|Priorizar avisos importantes
Alertas de segurança|Security alerts|Alertas de seguridad
Notificar sobre acessos e atividades sensíveis|Notify about sign-ins and sensitive activity|Notificar sobre accesos y actividades sensibles
Nome|Name|Nombre
Cancelar|Cancel|Cancelar
Salvar alterações|Save changes|Guardar cambios
Senha atual|Current password|Contraseña actual
Nova senha|New password|Nueva contraseña
Confirmar nova senha|Confirm new password|Confirmar nueva contraseña
Salvando...|Saving...|Guardando...
Enquadramento da foto|Photo framing|Encuadre de la foto
Prévia da foto de perfil|Profile photo preview|Vista previa de la foto de perfil
Arraste a foto para enquadrar. O círculo mostra como ela ficará no perfil. Você também pode usar as setas do teclado.|Drag the photo to frame it. The circle shows how it will appear on your profile. You can also use the arrow keys.|Arrastra la foto para encuadrarla. El círculo muestra cómo quedará en tu perfil. También puedes usar las flechas del teclado.
Diminuir zoom|Zoom out|Alejar
Aumentar zoom|Zoom in|Acercar
Selecionar foto|Select photo|Seleccionar foto
Remover foto de perfil|Remove profile photo|Eliminar foto de perfil
JPG, PNG ou WebP de até 2 MB.|JPG, PNG or WebP up to 2 MB.|JPG, PNG o WebP de hasta 2 MB.
Salvando foto...|Saving photo...|Guardando foto...
Carregando imagem...|Loading image...|Cargando imagen...
Não foi possível carregar suas preferências.|Could not load your preferences.|No se pudieron cargar tus preferencias.
Não foi possível salvar a preferência. Tente novamente.|Could not save the preference. Try again.|No se pudo guardar la preferencia. Inténtalo de nuevo.
Selecione uma imagem JPG, PNG ou WebP.|Select a JPG, PNG or WebP image.|Selecciona una imagen JPG, PNG o WebP.
Selecione uma imagem de até 2 MB que não esteja vazia.|Select a nonempty image up to 2 MB.|Selecciona una imagen no vacía de hasta 2 MB.
Não foi possível ler a imagem. Selecione outro arquivo.|Could not read the image. Select another file.|No se pudo leer la imagen. Selecciona otro archivo.
Não foi possível abrir a imagem. Selecione outro arquivo.|Could not open the image. Select another file.|No se pudo abrir la imagen. Selecciona otro archivo.
Foto de perfil removida.|Profile photo removed.|Foto de perfil eliminada.
Não foi possível remover a foto. Tente novamente.|Could not remove the photo. Try again.|No se pudo eliminar la foto. Inténtalo de nuevo.
Entre na sua conta para salvar a foto.|Sign in to save the photo.|Inicia sesión para guardar la foto.
Não foi possível preparar a foto.|Could not prepare the photo.|No se pudo preparar la foto.
A sessão foi alterada. Entre novamente.|The session changed. Sign in again.|La sesión cambió. Inicia sesión de nuevo.
Foto de perfil atualizada.|Profile photo updated.|Foto de perfil actualizada.
Não foi possível salvar a foto. Tente novamente.|Could not save the photo. Try again.|No se pudo guardar la foto. Inténtalo de nuevo.
Informe um nome para continuar.|Enter a name to continue.|Introduce un nombre para continuar.
Nome atualizado com sucesso.|Name updated successfully.|Nombre actualizado correctamente.
Não foi possível atualizar o nome.|Could not update the name.|No se pudo actualizar el nombre.
Aguarde a verificação de disponibilidade.|Wait for the availability check.|Espera la comprobación de disponibilidad.
Username atualizado.|Username updated.|Nombre de usuario actualizado.
Não foi possível atualizar. Verifique se o username já está em uso.|Could not update. Check whether the username is already taken.|No se pudo actualizar. Comprueba si el nombre de usuario ya está en uso.
Preencha todos os campos.|Fill in all fields.|Completa todos los campos.
A nova senha precisa ter pelo menos 10 caracteres.|The new password must have at least 10 characters.|La nueva contraseña debe tener al menos 10 caracteres.
A confirmação precisa coincidir com a nova senha.|The confirmation must match the new password.|La confirmación debe coincidir con la nueva contraseña.
Senha alterada com sucesso.|Password changed successfully.|Contraseña cambiada correctamente.
Não foi possível alterar a senha. Verifique a senha atual.|Could not change the password. Check your current password.|No se pudo cambiar la contraseña. Comprueba la contraseña actual.
Verificando disponibilidade...|Checking availability...|Comprobando disponibilidad...
Formato válido. A disponibilidade será verificada ao salvar.|Valid format. Availability will be checked when saving.|Formato válido. La disponibilidad se comprobará al guardar.
Use letras, números, ponto ou underline, sem espaços.|Use letters, numbers, dots or underscores, without spaces.|Usa letras, números, puntos o guiones bajos, sin espacios.
Informe um username.|Enter a username.|Introduce un nombre de usuario.
O username não pode conter espaços.|The username cannot contain spaces.|El nombre de usuario no puede contener espacios.
O username precisa ter entre 3 e 24 caracteres.|The username must have between 3 and 24 characters.|El nombre de usuario debe tener entre 3 y 24 caracteres.
Use apenas letras, números, ponto ou underline.|Use only letters, numbers, dots or underscores.|Usa solo letras, números, puntos o guiones bajos.
Idioma atualizado.|Language updated.|Idioma actualizado.
Conta privada ativada.|Private account enabled.|Cuenta privada activada.
Conta pública ativada.|Public account enabled.|Cuenta pública activada.
Tema escuro ativo.|Dark theme enabled.|Tema oscuro activado.
Tema claro ativo.|Light theme enabled.|Tema claro activado.
Modo compacto ativado.|Compact mode enabled.|Modo compacto activado.
Modo compacto desativado.|Compact mode disabled.|Modo compacto desactivado.
Preferência atualizada.|Preference updated.|Preferencia actualizada.
SUA VOZ. NOSSA CIDADE.|YOUR VOICE. OUR CITY.|TU VOZ. NUESTRA CIUDAD.
Pequenas atitudes.|Small actions.|Pequeñas acciones.
Uma cidade melhor.|A better city.|Una ciudad mejor.
Uma cidade melhor|A better city|Una ciudad mejor
Registre um problema, conecte sua comunidade e acompanhe cada passo da solução.|Report a problem, connect your community and follow every step toward a solution.|Registra un problema, conecta a tu comunidad y sigue cada paso hacia la solución.
Registrar ocorrência|Report an issue|Registrar incidencia
Seu bairro em movimento|Your neighborhood in action|Tu barrio en movimiento
Filtrar por categoria|Filter by category|Filtrar por categoría
O que acontece na cidade|What's happening in the city|Qué ocurre en la ciudad
Explore por categoria|Explore by category|Explorar por categoría
Ver categorias anteriores|View previous categories|Ver categorías anteriores
Ver próximas categorias|View next categories|Ver siguientes categorías
ACOMPANHE E PARTICIPE|FOLLOW AND PARTICIPATE|SIGUE Y PARTICIPA
Relatos da comunidade|Community reports|Relatos de la comunidad
ocorrência|issue|incidencia
ocorrências|issues|incidencias
Filtrar por situação|Filter by status|Filtrar por estado
Carregando publicações|Loading posts|Cargando publicaciones
Não foi possível carregar o feed|Could not load the feed|No se pudo cargar el feed
Tentar novamente|Try again|Intentarlo de nuevo
Todas|All|Todas
Todos|All|Todos
Infraestrutura|Infrastructure|Infraestructura
Iluminação|Lighting|Iluminación
Iluminação pública|Public lighting|Alumbrado público
Limpeza|Cleaning|Limpieza
Limpeza urbana|Urban cleaning|Limpieza urbana
Acessibilidade|Accessibility|Accesibilidad
Trânsito|Traffic|Tránsito
Meio ambiente|Environment|Medio ambiente
Outros|Other|Otros
Aberta|Open|Abierta
Abertas|Open|Abiertas
Em andamento|In progress|En curso
Fechada|Closed|Cerrada
Resolvida|Resolved|Resuelta
Resolvidas|Resolved|Resueltas
Configurações|Settings|Configuración
Início|Home|Inicio
Perfil|Profile|Perfil
Pesquisar|Search|Buscar
Pesquisar cidades e usuários|Search cities and users|Buscar ciudades y usuarios
Pesquise por cidades e usuários|Search for cities and users|Busca ciudades y usuarios
Navegação principal|Main navigation|Navegación principal
Abrir opções da conta|Open account options|Abrir opciones de la cuenta
Sair|Sign out|Salir
Sair da sua conta|Sign out of your account|Salir de tu cuenta
Você pode entrar novamente a qualquer momento. Deseja realmente sair?|You can sign in again at any time. Do you really want to sign out?|Puedes volver a iniciar sesión en cualquier momento. ¿Quieres salir?
Nova publicação|New post|Nueva publicación
Nova ocorrência|New issue|Nueva incidencia
Comunidade|Community|Comunidad
Cidades|Cities|Ciudades
Cidades sugeridas|Suggested cities|Ciudades sugeridas
Pessoa|Person|Persona
Cidade|City|Ciudad
Publicações|Posts|Publicaciones
Atualizações da comunidade|Community updates|Actualizaciones de la comunidad
Nenhum resultado encontrado|No results found|No se encontraron resultados
Tente pesquisar por outro termo.|Try searching for another term.|Intenta buscar otro término.
Ir para o conteúdo|Skip to content|Ir al contenido
Sobre o Spectrum|About Spectrum|Sobre Spectrum
Moderação|Moderation|Moderación
Seguir|Follow|Seguir
Seguindo|Following|Siguiendo
Seguidores|Followers|Seguidores
Voltar|Back|Volver
Fechar|Close|Cerrar
Entendi|Got it|Entendido
Fechar alerta|Close alert|Cerrar alerta
Próximo|Next|Siguiente
Anterior|Previous|Anterior
Entrar|Sign in|Iniciar sesión
Cadastrar|Sign up|Registrarse
Criar conta|Create account|Crear cuenta
Entrar na conta|Sign in to your account|Iniciar sesión en tu cuenta
Entrar com o Google|Sign in with Google|Iniciar sesión con Google
Ou|Or|O
Não possui uma conta?|Don't have an account?|¿No tienes una cuenta?
Já possui uma conta?|Already have an account?|¿Ya tienes una cuenta?
Esqueceu a senha?|Forgot your password?|¿Olvidaste tu contraseña?
Usuário ou e-mail|Username or email|Usuario o correo electrónico
Seu usuário ou e-mail|Your username or email|Tu usuario o correo electrónico
Senha|Password|Contraseña
Sua senha|Your password|Tu contraseña
Confirmar senha|Confirm password|Confirmar contraseña
Seu nome|Your name|Tu nombre
Nome próprio|First name|Nombre
Nome de usuário|Username|Nombre de usuario
Seu nome de usuário|Your username|Tu nombre de usuario
Email|Email|Correo electrónico
E-mail|Email|Correo electrónico
Seu email|Your email|Tu correo electrónico
Data de nascimento|Date of birth|Fecha de nacimiento
Telefone|Phone|Teléfono
Estado|State|Estado
Município|Municipality|Municipio
Selecione seu estado|Select your state|Selecciona tu estado
Selecione seu município|Select your municipality|Selecciona tu municipio
Etapas do cadastro|Registration steps|Pasos del registro
Informe seu nome de usuário ou email e sua senha para entrar.|Enter your username or email and password to sign in.|Introduce tu usuario o correo y tu contraseña para iniciar sesión.
Conta Google confirmada. Complete seus dados para criar sua conta no Spectrum.|Google account confirmed. Complete your details to create your Spectrum account.|Cuenta de Google confirmada. Completa tus datos para crear tu cuenta en Spectrum.
Crie uma senha do Spectrum para também poder entrar com e-mail e senha. Não use sua senha do Google.|Create a Spectrum password to also sign in with email and password. Do not use your Google password.|Crea una contraseña de Spectrum para iniciar sesión con correo y contraseña. No uses tu contraseña de Google.
Campo obrigatório|Required field|Campo obligatorio
Campos obrigatórios|Required fields|Campos obligatorios
Digite um email válido|Enter a valid email|Introduce un correo válido
A senha deve ter no mínimo 10 caracteres|The password must have at least 10 characters|La contraseña debe tener al menos 10 caracteres
A senha deve ter no máximo 30 caracteres|The password must have at most 30 characters|La contraseña debe tener como máximo 30 caracteres
Valor inválido|Invalid value|Valor inválido
Recuperar senha|Recover password|Recuperar contraseña
Redefinir senha|Reset password|Restablecer contraseña
Enviar link|Send link|Enviar enlace
Digite o email associado à sua conta e enviaremos um link para você redefinir sua senha.|Enter the email linked to your account and we'll send a password reset link.|Introduce el correo asociado a tu cuenta y te enviaremos un enlace para restablecer tu contraseña.
Digite sua nova senha para recuperar o acesso à sua conta.|Enter your new password to regain access to your account.|Introduce tu nueva contraseña para recuperar el acceso a tu cuenta.
Digite sua nova senha|Enter your new password|Introduce tu nueva contraseña
Digite sua nova senha novamente|Enter your new password again|Introduce tu nueva contraseña de nuevo
Voltar ao login|Back to sign in|Volver al inicio de sesión
Voltar para o login|Back to sign in|Volver al inicio de sesión
Ir para login|Go to sign in|Ir al inicio de sesión
Verificando email|Verifying email|Verificando correo
Estamos confirmando seu cadastro. Isso leva alguns segundos.|We're confirming your registration. This takes a few seconds.|Estamos confirmando tu registro. Esto tarda unos segundos.
Email verificado|Email verified|Correo verificado
Seu email foi confirmado com sucesso.|Your email was confirmed successfully.|Tu correo se confirmó correctamente.
Link inválido|Invalid link|Enlace inválido
Não encontramos o token de verificação neste link. Solicite um novo email de confirmação.|No verification token was found in this link. Request a new confirmation email.|No se encontró el token de verificación en este enlace. Solicita un nuevo correo de confirmación.
O link pode estar inválido ou expirado. Tente solicitar uma nova verificação.|The link may be invalid or expired. Request another verification.|El enlace puede ser inválido o haber caducado. Solicita una nueva verificación.
Não foi possível verificar|Could not verify|No se pudo verificar
Não foi possível conectar ao servidor.|Could not connect to the server.|No se pudo conectar al servidor.
Cadastro incompleto|Incomplete registration|Registro incompleto
Cadastro criado|Account created|Cuenta creada
Cadastro não realizado|Registration failed|Registro fallido
Cadastro Google expirado|Google registration expired|Registro con Google caducado
Preencha todos os campos obrigatórios para criar sua conta.|Fill in all required fields to create your account.|Completa todos los campos obligatorios para crear tu cuenta.
Entre com Google novamente para continuar.|Sign in with Google again to continue.|Inicia sesión con Google de nuevo para continuar.
Não foi possível concluir o cadastro|Could not complete registration|No se pudo completar el registro
Estados indisponíveis|States unavailable|Estados no disponibles
Municípios indisponíveis|Municipalities unavailable|Municipios no disponibles
Não foi possível carregar os estados.|Could not load the states.|No se pudieron cargar los estados.
Não foi possível carregar os municípios.|Could not load the municipalities.|No se pudieron cargar los municipios.
Login realizado|Signed in|Sesión iniciada
Você entrou na sua conta com sucesso.|You signed in successfully.|Iniciaste sesión correctamente.
Não foi possível entrar|Could not sign in|No se pudo iniciar sesión
Verifique seu usuário, email e senha.|Check your username, email and password.|Comprueba tu usuario, correo y contraseña.
Verifique os dados e tente novamente.|Check your details and try again.|Comprueba tus datos e inténtalo de nuevo.
Verifique os dados informados e tente novamente.|Check the details you entered and try again.|Comprueba los datos introducidos e inténtalo de nuevo.
Tente fazer login novamente.|Try signing in again.|Intenta iniciar sesión de nuevo.
Erro no login Google|Google sign-in error|Error al iniciar sesión con Google
Não foi possível conectar ao Google. Verifique sua conexão e tente novamente.|Could not connect to Google. Check your connection and try again.|No se pudo conectar con Google. Comprueba tu conexión e inténtalo de nuevo.
Não foi possível conectar ao servidor do Spectrum. Verifique se a API está disponível.|Could not connect to the Spectrum server. Check whether the API is available.|No se pudo conectar al servidor de Spectrum. Comprueba si la API está disponible.
Não foi possível validar esta tentativa de login. Volte e tente novamente.|Could not validate this sign-in attempt. Go back and try again.|No se pudo validar este intento de inicio de sesión. Vuelve e inténtalo de nuevo.
O Google não autorizou o login. Tente novamente.|Google did not authorize sign-in. Try again.|Google no autorizó el inicio de sesión. Inténtalo de nuevo.
O Google não retornou um código de autorização. Tente novamente.|Google did not return an authorization code. Try again.|Google no devolvió un código de autorización. Inténtalo de nuevo.
O login com Google foi cancelado. Você pode tentar novamente.|Google sign-in was cancelled. You can try again.|Se canceló el inicio de sesión con Google. Puedes intentarlo de nuevo.
O login com Google não está configurado.|Google sign-in is not configured.|El inicio de sesión con Google no está configurado.
O servidor demorou para responder. Aguarde alguns instantes e tente novamente.|The server took too long to respond. Wait a moment and try again.|El servidor tardó demasiado en responder. Espera un momento e inténtalo de nuevo.
O servidor demorou para responder. Tente novamente em alguns instantes.|The server took too long to respond. Try again in a moment.|El servidor tardó demasiado en responder. Inténtalo de nuevo en un momento.
O servidor demorou para responder. Tente novamente.|The server took too long to respond. Try again.|El servidor tardó demasiado en responder. Inténtalo de nuevo.
O servidor não conseguiu concluir o login com Google. Tente novamente; se persistir, contate a equipe do Spectrum.|The server could not complete Google sign-in. Try again; if it persists, contact the Spectrum team.|El servidor no pudo completar el inicio de sesión con Google. Inténtalo de nuevo; si persiste, contacta al equipo de Spectrum.
O servidor não retornou os dados de cadastro.|The server did not return registration details.|El servidor no devolvió los datos de registro.
O servidor não retornou uma sessão válida.|The server did not return a valid session.|El servidor no devolvió una sesión válida.
O servidor não retornou uma sessão válida. Tente novamente.|The server did not return a valid session. Try again.|El servidor no devolvió una sesión válida. Inténtalo de nuevo.
A cidade é de todos.|The city belongs to everyone.|La ciudad es de todos.
A mudança também.|So does change.|El cambio también.
Conecte-se com a sua comunidade e ajude a transformar os lugares que fazem parte da sua vida.|Connect with your community and help transform the places in your life.|Conecta con tu comunidad y ayuda a transformar los lugares que forman parte de tu vida.
Conexões locais. Transformações reais.|Local connections. Real change.|Conexiones locales. Cambios reales.
Um novo olhar para o seu bairro.|A new perspective on your neighborhood.|Una nueva mirada a tu barrio.
começa com a gente.|starts with us.|empieza con nosotros.
COMUNIDADE EM MOVIMENTO|COMMUNITY IN ACTION|COMUNIDAD EN MOVIMIENTO
Cada lugar tem uma história. Faça parte da próxima mudança.|Every place has a story. Be part of the next change.|Cada lugar tiene una historia. Forma parte del próximo cambio.
Seu olhar ajuda a transformar os lugares que compartilhamos.|Your perspective helps transform the places we share.|Tu mirada ayuda a transformar los lugares que compartimos.
O SEU OLHAR FAZ A DIFERENÇA|YOUR PERSPECTIVE MAKES A DIFFERENCE|TU MIRADA MARCA LA DIFERENCIA
Cada relato coloca uma mudança no mapa.|Every report puts change on the map.|Cada relato pone un cambio en el mapa.
PASSO A PASSO|STEP BY STEP|PASO A PASO
Do relato à solução|From report to solution|Del relato a la solución
Registrar um problema|Report a problem|Registrar un problema
Compartilhe uma atualização|Share an update|Comparte una actualización
Conteúdo|Content|Contenido
Localização|Location|Ubicación
Localização não informada|Location not provided|Ubicación no indicada
Localização selecionada|Selected location|Ubicación seleccionada
Remover localização|Remove location|Eliminar ubicación
Selecione a localização|Select a location|Selecciona la ubicación
Ex: Centro, Salvador - BA|E.g.: Centro, Salvador - BA|Ej.: Centro, Salvador - BA
Tags|Tags|Etiquetas
bairro, alerta|neighborhood, alert|barrio, alerta
Tipo de mídia|Media type|Tipo de medio
Vídeo|Video|Vídeo
Video|Video|Vídeo
Imagem|Image|Imagen
Texto|Text|Texto
Imagem anexada|Attached image|Imagen adjunta
Vídeo anexado|Attached video|Vídeo adjunto
Prévia da publicação|Post preview|Vista previa de la publicación
Publicar agora|Publish now|Publicar ahora
Publicar ocorrência|Publish issue|Publicar incidencia
Criar ocorrência|Create issue|Crear incidencia
Editar ocorrência|Edit issue|Editar incidencia
Editar publicação|Edit post|Editar publicación
O que está acontecendo?|What's happening?|¿Qué está pasando?
O que está sendo reportado?|What's being reported?|¿Qué se está reportando?
Título da ocorrência|Issue title|Título de la incidencia
Título curto da ocorrência|Short issue title|Título breve de la incidencia
Descrição detalhada|Detailed description|Descripción detallada
Descrição detalhada da ocorrência|Detailed issue description|Descripción detallada de la incidencia
Conte o que aconteceu de forma objetiva|Describe what happened clearly|Describe lo que pasó de forma objetiva
Categoria|Category|Categoría
Categoria da ocorrência|Issue category|Categoría de la incidencia
Selecione uma categoria|Select a category|Selecciona una categoría
Importância|Importance|Importancia
Gravidade|Severity|Gravedad
Baixa|Low|Baja
Média|Medium|Media
Alta|High|Alta
Impacto limitado, sem impedir o uso do espaço.|Limited impact, without preventing use of the space.|Impacto limitado, sin impedir el uso del espacio.
Prejudica a circulação ou o uso do local, mas existe alternativa.|Disrupts movement or use of the location, but an alternative exists.|Dificulta la circulación o el uso del lugar, pero existe una alternativa.
Risco à segurança ou impedimento de acesso essencial. Descreva o impacto observado.|Safety risk or blocked essential access. Describe the observed impact.|Riesgo para la seguridad o impedimento de acceso esencial. Describe el impacto observado.
Estado*|State*|Estado*
Cidade*|City*|Ciudad*
Estado da ocorrência|Issue state|Estado de la incidencia
Cidade da ocorrência|Issue city|Ciudad de la incidencia
Bairro|Neighborhood|Barrio
Bairro (opcional)|Neighborhood (optional)|Barrio (opcional)
Endereço ou ponto de referência*|Address or landmark*|Dirección o punto de referencia*
Endereço/local|Address/location|Dirección/ubicación
Rua das Flores, em frente ao número 120|Rua das Flores, opposite number 120|Rua das Flores, frente al número 120
Fotos e vídeos da ocorrência|Issue photos and videos|Fotos y vídeos de la incidencia
Fotos e vídeos ajudam a documentar a situação e dão contexto ao órgão responsável.|Photos and videos help document the situation and provide context for the responsible agency.|Las fotos y los vídeos ayudan a documentar la situación y dan contexto al organismo responsable.
Até 4 arquivos, 25 MB cada|Up to 4 files, 25 MB each|Hasta 4 archivos, 25 MB cada uno
Adicionar imagens|Add images|Añadir imágenes
Adicionar vídeos|Add videos|Añadir vídeos
Selecionar imagens|Select images|Seleccionar imágenes
Selecionar vídeos|Select videos|Seleccionar vídeos
Cancelar e fechar|Cancel and close|Cancelar y cerrar
O período de edição de 15 minutos foi encerrado.|The 15-minute editing period has ended.|El período de edición de 15 minutos ha terminado.
Informe um título curto para o problema.|Enter a short title for the problem.|Introduce un título breve para el problema.
Explique o problema com mais detalhes.|Explain the problem in more detail.|Explica el problema con más detalle.
Selecione a categoria da ocorrência.|Select the issue category.|Selecciona la categoría de la incidencia.
Selecione o nível de importância.|Select the importance level.|Selecciona el nivel de importancia.
Selecione o estado da ocorrência.|Select the issue state.|Selecciona el estado de la incidencia.
Selecione a cidade da ocorrência.|Select the issue city.|Selecciona la ciudad de la incidencia.
Informe o endereço ou um ponto de referência para localizar o problema.|Enter an address or landmark to locate the problem.|Introduce una dirección o referencia para ubicar el problema.
Você pode adicionar até quatro evidências.|You can add up to four pieces of evidence.|Puedes añadir hasta cuatro evidencias.
Entre novamente na sua conta para publicar a ocorrência.|Sign in again to publish the issue.|Inicia sesión de nuevo para publicar la incidencia.
Não foi possível publicar a ocorrência. Tente novamente.|Could not publish the issue. Try again.|No se pudo publicar la incidencia. Inténtalo de nuevo.
Não foi possível publicar|Could not publish|No se pudo publicar
Preencha conteúdo e localização para continuar.|Fill in content and location to continue.|Completa el contenido y la ubicación para continuar.
Sua ocorrência já aparece no feed com o status Aberta.|Your issue now appears in the feed with Open status.|Tu incidencia ya aparece en el feed con el estado Abierta.
Sua publicação foi salva e já aparece no feed.|Your post was saved and now appears in the feed.|Tu publicación se guardó y ya aparece en el feed.
Publicação criada|Post created|Publicación creada
Publicação atualizada|Post updated|Publicación actualizada
As alterações foram salvas.|Changes saved.|Cambios guardados.
As alterações já aparecem no feed.|Your changes now appear in the feed.|Tus cambios ya aparecen en el feed.
Alterações salvas. O encaminhamento usará as informações atualizadas.|Changes saved. Forwarding will use the updated information.|Cambios guardados. El envío usará la información actualizada.
Publicação não encontrada para edição.|Post not found for editing.|No se encontró la publicación para editarla.
Publicação não encontrada para exclusão.|Post not found for deletion.|No se encontró la publicación para eliminarla.
Somente ocorrências locais podem ser atualizadas neste modo.|Only local issues can be updated in this mode.|Solo las incidencias locales se pueden actualizar en este modo.
O prazo para editar esta publicação expirou.|The editing period for this post has expired.|El plazo para editar esta publicación ha vencido.
Você só pode excluir suas próprias publicações.|You can only delete your own posts.|Solo puedes eliminar tus propias publicaciones.
Publicação sem mídia|Post without media|Publicación sin medios
Imagem da publicação|Post image|Imagen de la publicación
Abrir opções da publicação|Open post options|Abrir opciones de la publicación
Curtir publicação|Like post|Me gusta la publicación
Descurtir publicação|Unlike post|Quitar me gusta de la publicación
Comentar publicação|Comment on post|Comentar publicación
Salvar publicação|Save post|Guardar publicación
Compartilhar|Share|Compartir
Copiar link|Copy link|Copiar enlace
Link copiado|Link copied|Enlace copiado
Link da ocorrência compartilhado.|Issue link shared.|Enlace de la incidencia compartido.
Link da ocorrência copiado.|Issue link copied.|Enlace de la incidencia copiado.
O link da ocorrência foi copiado para a área de transferência.|The issue link was copied to the clipboard.|El enlace de la incidencia se copió al portapapeles.
Não foi possível copiar|Could not copy|No se pudo copiar
Não foi possível copiar o link. Tente novamente.|Could not copy the link. Try again.|No se pudo copiar el enlace. Inténtalo de nuevo.
Excluir publicação|Delete post|Eliminar publicación
Denunciar publicação|Report post|Denunciar publicación
Ocultar publicações desse usuário|Hide this user's posts|Ocultar publicaciones de este usuario
Não tenho interesse|Not interested|No me interesa
Detalhes da publicação|Post details|Detalles de la publicación
Ver publicação|View post|Ver publicación
Ver publicações|View posts|Ver publicaciones
Ver ocorrência|View issue|Ver incidencia
Abrir ocorrência|Open issue|Abrir incidencia
Também identifiquei este problema.|I also noticed this problem.|También identifiqué este problema.
Também identificado|Also noticed|También identificado
Disponível por 15 min|Available for 15 min|Disponible durante 15 min
Repost realizado|Reposted|Republicado
Repost removido|Repost removed|Republicación eliminada
Repost excluído|Repost deleted|Republicación eliminada
A ocorrência foi adicionada ao seu perfil.|The issue was added to your profile.|La incidencia se añadió a tu perfil.
O repost foi removido do seu perfil.|The repost was removed from your profile.|La republicación se eliminó de tu perfil.
O repost foi removido.|The repost was removed.|La republicación se eliminó.
Não foi possível repostar|Could not repost|No se pudo republicar
Não foi possível excluir|Could not delete|No se pudo eliminar
Ocorrências preservam seu histórico. Apenas reposts próprios podem ser excluídos.|Issues preserve their history. Only your own reposts can be deleted.|Las incidencias conservan su historial. Solo se pueden eliminar tus propias republicaciones.
Tente novamente em instantes.|Try again in a moment.|Inténtalo de nuevo en un momento.
Publicações ocultadas|Posts hidden|Publicaciones ocultadas
Publicação ocultada|Post hidden|Publicación ocultada
A publicação foi removida desta visualização.|The post was removed from this view.|La publicación se eliminó de esta vista.
Usaremos esse sinal para melhorar suas recomendações.|We'll use this feedback to improve your recommendations.|Usaremos esta señal para mejorar tus recomendaciones.
Falha ao carregar|Loading failed|Error al cargar
Tente carregar mais ocorrências novamente.|Try loading more issues again.|Intenta cargar más incidencias de nuevo.
Carregar mais|Load more|Cargar más
Salvar|Save|Guardar
Reposts|Reposts|Republicaciones
Posts salvos|Saved posts|Publicaciones guardadas
Posts salvos são privados.|Saved posts are private.|Las publicaciones guardadas son privadas.
Nenhum post salvo ainda.|No saved posts yet.|Aún no hay publicaciones guardadas.
Nenhum repost ainda.|No reposts yet.|Aún no hay republicaciones.
Nenhuma publicação ainda.|No posts yet.|Aún no hay publicaciones.
Não foi possível carregar este perfil.|Could not load this profile.|No se pudo cargar este perfil.
Não foi possível atualizar|Could not update|No se pudo actualizar
Não conseguimos atualizar|Could not update|No se pudo actualizar
A conta pode ser privada. Tente novamente.|The account may be private. Try again.|La cuenta puede ser privada. Inténtalo de nuevo.
Abrir opções do perfil|Open profile options|Abrir opciones del perfil
Configurações de perfil|Profile settings|Configuración del perfil
Abas do perfil|Profile tabs|Pestañas del perfil
Capa do perfil|Profile cover|Portada del perfil
Bio|Bio|Biografía
Este usuário ainda não adicionou uma bio.|This user has not added a bio yet.|Este usuario aún no ha añadido una biografía.
Usuário|User|Usuario
Usuário Spectrum|Spectrum user|Usuario de Spectrum
Participante da comunidade|Community member|Participante de la comunidad
Carregando perfil|Loading profile|Cargando perfil
Denunciar perfil|Report profile|Denunciar perfil
Lista de notificações|Notification list|Lista de notificaciones
Carregando notificações|Loading notifications|Cargando notificaciones
Marcar todas como lidas|Mark all as read|Marcar todas como leídas
Nenhuma notificação no momento.|No notifications right now.|No hay notificaciones por ahora.
Não há mais mensagens|No more messages|No hay más mensajes
Remover notificação|Remove notification|Eliminar notificación
Não foi possível carregar as notificações. Tente novamente.|Could not load notifications. Try again.|No se pudieron cargar las notificaciones. Inténtalo de nuevo.
Não foi possível carregar mais notificações.|Could not load more notifications.|No se pudieron cargar más notificaciones.
Denúncia enviada|Report submitted|Denuncia enviada
Obrigado por ajudar a manter a comunidade mais segura.|Thank you for helping keep the community safer.|Gracias por ayudar a mantener la comunidad más segura.
Motivo da denúncia|Reason for reporting|Motivo de la denuncia
Selecione o motivo da denúncia.|Select the reason for reporting.|Selecciona el motivo de la denuncia.
Abuso ou assédio|Abuse or harassment|Abuso o acoso
Conteúdo sexual|Sexual content|Contenido sexual
Segurança infantil|Child safety|Seguridad infantil
Discurso de ódio|Hate speech|Discurso de odio
Parece spam de IA|Looks like AI spam|Parece spam de IA
Sua denúncia foi registrada com sucesso. Nossa equipe irá analisar seu relato e iremos retornar o mais breve possível. Agradecemos sua confiança e colaboração para manter nossa comunidade segura.|Your report was submitted successfully. Our team will review it and respond as soon as possible. Thank you for your trust and help keeping our community safe.|Tu denuncia se registró correctamente. Nuestro equipo la revisará y responderá lo antes posible. Gracias por tu confianza y colaboración para mantener nuestra comunidad segura.
Denunciar comentário|Report comment|Denunciar comentario
Mais opções do comentário|More comment options|Más opciones del comentario
Curtir comentário|Like comment|Me gusta el comentario
Descurtir comentário|Unlike comment|Quitar me gusta del comentario
Adicionar comentário...|Add a comment...|Añadir comentario...
Enviar comentário|Send comment|Enviar comentario
Carregando comentários...|Loading comments...|Cargando comentarios...
Seja o primeiro a comentar.|Be the first to comment.|Sé el primero en comentar.
Excluir comentário|Delete comment|Eliminar comentario
Excluir seu comentário?|Delete your comment?|¿Eliminar tu comentario?
Comentário adicionado|Comment added|Comentario añadido
Comentário editado|Comment edited|Comentario editado
Comentário removido|Comment removed|Comentario eliminado
Comentário excluído.|Comment deleted.|Comentario eliminado.
Link do comentário copiado.|Comment link copied.|Enlace del comentario copiado.
Não foi possível carregar os comentários.|Could not load comments.|No se pudieron cargar los comentarios.
Não foi possível enviar o comentário. Tente novamente.|Could not send the comment. Try again.|No se pudo enviar el comentario. Inténtalo de nuevo.
Não foi possível excluir o comentário. Tente novamente.|Could not delete the comment. Try again.|No se pudo eliminar el comentario. Inténtalo de nuevo.
Não foi possível salvar a alteração. Tente novamente.|Could not save the change. Try again.|No se pudo guardar el cambio. Inténtalo de nuevo.
Não foi possível salvar sua reação. Tente novamente.|Could not save your reaction. Try again.|No se pudo guardar tu reacción. Inténtalo de nuevo.
Visualizador de mídia|Media viewer|Visor de medios
Fechar visualizador|Close viewer|Cerrar visor
Mídia anterior|Previous media|Medio anterior
Próxima mídia|Next media|Medio siguiente
Expandir foto da evidência|Expand evidence photo|Ampliar foto de la evidencia
Reproduzir vídeo da evidência|Play evidence video|Reproducir vídeo de la evidencia
Evidência da ocorrência|Issue evidence|Evidencia de la incidencia
Evidência|Evidence|Evidencia
Registro sem arquivo|Record without a file|Registro sin archivo
Resultado de pesquisa|Search result|Resultado de búsqueda
Cidade não encontrada|City not found|Ciudad no encontrada
Volte para a pesquisa e escolha uma das cidades disponíveis.|Return to search and choose an available city.|Vuelve a la búsqueda y elige una ciudad disponible.
Carregando cidade|Loading city|Cargando ciudad
Publicações da cidade|City posts|Publicaciones de la ciudad
Explore as cidades|Explore cities|Explorar ciudades
Não foi possível carregar as cidades. Tente novamente.|Could not load cities. Try again.|No se pudieron cargar las ciudades. Inténtalo de nuevo.
Não foi possível carregar os estados. Tente novamente.|Could not load states. Try again.|No se pudieron cargar los estados. Inténtalo de nuevo.
Não foi possível carregar as ocorrências. Tente novamente.|Could not load issues. Try again.|No se pudieron cargar las incidencias. Inténtalo de nuevo.
Função|Role|Rol
Formulário|Form|Formulario
Interações|Interactions|Interacciones
NOSSA CIDADE, EM ACOMPANHAMENTO|OUR CITY, UNDER OBSERVATION|NUESTRA CIUDAD, EN SEGUIMIENTO
Visão geral|Overview|Vista general
Visão geral dos estados|State overview|Vista general de los estados
Filtros|Filters|Filtros
Período|Period|Período
Últimos 7 dias|Last 7 days|Últimos 7 días
Últimos 30 dias|Last 30 days|Últimos 30 días
Últimos 90 dias|Last 90 days|Últimos 90 días
Últimos 12 meses|Last 12 months|Últimos 12 meses
Dia selecionado|Selected day|Día seleccionado
Aplicar filtros|Apply filters|Aplicar filtros
Limpar filtros|Clear filters|Borrar filtros
Limpar|Clear|Borrar
Situação|Status|Estado
Situação da ocorrência|Issue status|Estado de la incidencia
Tipos de problema|Problem types|Tipos de problema
Recorte dos dados|Data scope|Alcance de los datos
Nenhum dado para os filtros selecionados.|No data for the selected filters.|No hay datos para los filtros seleccionados.
Nenhuma cidade possui ocorrências para este recorte.|No city has issues for this scope.|Ninguna ciudad tiene incidencias en este alcance.
Nenhuma ocorrência no período selecionado.|No issues in the selected period.|No hay incidencias en el período seleccionado.
Os totais refletem registros na plataforma e não representam, isoladamente, qualidade urbana.|Totals reflect platform records and do not, on their own, represent urban quality.|Los totales reflejan registros de la plataforma y no representan por sí solos la calidad urbana.
Apenas registros públicos da plataforma. O ranking não representa qualidade urbana.|Only public platform records. The ranking does not represent urban quality.|Solo registros públicos de la plataforma. La clasificación no representa la calidad urbana.
Ranking pela taxa de resolução: resolvidas ÷ criadas em cada estado. As barras mostram a participação de cada estado no total de ocorrências criadas e no total de resolvidas, dentro dos filtros e do período selecionados.|Ranking by resolution rate: resolved ÷ created in each state. Bars show each state's share of total created and resolved issues within the selected filters and period.|Clasificación por tasa de resolución: resueltas ÷ creadas en cada estado. Las barras muestran la participación de cada estado en el total de incidencias creadas y resueltas según los filtros y el período seleccionados.
Total de ocorrências|Total issues|Total de incidencias
Ocorrências no período|Issues in the period|Incidencias en el período
Tempo médio|Average time|Tiempo medio
Tempo até resolução|Time to resolution|Tiempo hasta la resolución
Média diária no período|Daily average in the period|Promedio diario en el período
Médias agregadas|Aggregated averages|Promedios agregados
em média|on average|en promedio
taxa de resolução|resolution rate|tasa de resolución
Categoria frequente|Frequent category|Categoría frecuente
Categoria principal|Main category|Categoría principal
Registros públicos|Public records|Registros públicos
Comparação entre cidades|City comparison|Comparación entre ciudades
Comparação em porcentagem|Percentage comparison|Comparación en porcentajes
Por cidade|By city|Por ciudad
Por dia|By day|Por día
Abertas por cidade|Open issues by city|Incidencias abiertas por ciudad
Resolvidas por cidade|Resolved issues by city|Incidencias resueltas por ciudad
Ocorrências por categoria|Issues by category|Incidencias por categoría
Evolução diária das ocorrências|Daily issue trends|Evolución diaria de las incidencias
Gráficos das ocorrências|Issue charts|Gráficos de incidencias
Participação nas ocorrências criadas|Share of created issues|Participación en las incidencias creadas
Participação nas ocorrências resolvidas|Share of resolved issues|Participación en las incidencias resueltas
Ocorrências recentes|Recent issues|Incidencias recientes
Sem nota arbitrária|No arbitrary score|Sin puntuación arbitraria
Calculando indicadores|Calculating metrics|Calculando indicadores
Carregando indicadores|Loading metrics|Cargando indicadores
Indicadores indisponíveis|Metrics unavailable|Indicadores no disponibles
Não foi possível carregar os indicadores. Tente novamente em instantes.|Could not load metrics. Try again in a moment.|No se pudieron cargar los indicadores. Inténtalo de nuevo en un momento.
Total|Total|Total
RESULTADOS|RESULTS|RESULTADOS
ÁREA DA MODERAÇÃO|MODERATION AREA|ÁREA DE MODERACIÓN
Encaminhamentos|Forwarding|Envíos
Acompanhe os envios e ajude cada ocorrência a chegar à solução.|Track forwarding and help each issue reach a solution.|Sigue los envíos y ayuda a que cada incidencia llegue a una solución.
Abra uma ocorrência para selecionar o órgão, registrar uma resposta ou validar a resolução. Respostas por e-mail precisam ser registradas manualmente.|Open an issue to select an agency, record a response or validate resolution. Email responses must be recorded manually.|Abre una incidencia para seleccionar el organismo, registrar una respuesta o validar la resolución. Las respuestas por correo deben registrarse manualmente.
Até 100 ocorrências mais recentemente atualizadas. Os filtros e totais consideram essa lista.|Up to 100 most recently updated issues. Filters and totals apply to this list.|Hasta 100 incidencias actualizadas más recientemente. Los filtros y totales consideran esta lista.
Ocorrências carregadas|Loaded issues|Incidencias cargadas
Resumo das ocorrências carregadas|Summary of loaded issues|Resumen de las incidencias cargadas
Pendências|Pending items|Pendientes
Com pendência|With pending items|Con pendientes
Aguardando retorno|Awaiting response|Esperando respuesta
Respostas para analisar|Responses to review|Respuestas por revisar
Buscar ocorrência|Search issues|Buscar incidencia
Título, cidade, órgão ou identificador|Title, city, agency or identifier|Título, ciudad, organismo o identificador
Atualizar|Refresh|Actualizar
Carregando encaminhamentos…|Loading forwarding records…|Cargando envíos…
Não foi possível carregar as ocorrências. Verifique sua conexão e sua permissão de moderador.|Could not load issues. Check your connection and moderator permissions.|No se pudieron cargar las incidencias. Comprueba tu conexión y tus permisos de moderador.
Analisar resposta|Review response|Revisar respuesta
Ver pendência|View pending item|Ver pendiente
Paginação das ocorrências|Issue pagination|Paginación de incidencias
Página anterior|Previous page|Página anterior
Próxima página|Next page|Página siguiente
Publicada em|Published on|Publicada el
Órgão ainda não definido|Agency not yet assigned|Organismo aún no definido
Ocorrência criada|Issue created|Incidencia creada
Ocorrência atualizada|Issue updated|Incidencia actualizada
Ocorrência reaberta|Issue reopened|Incidencia reabierta
Ocorrência encaminhada|Issue forwarded|Incidencia enviada
Ocorrência reenviada|Issue resent|Incidencia reenviada
Ocorrência em resolução|Issue being resolved|Incidencia en resolución
Ocorrência rejeitada|Issue rejected|Incidencia rechazada
Ocorrência resolvida|Issue resolved|Incidencia resuelta
Ocorrência não encontrada|Issue not found|Incidencia no encontrada
Ocorrência não encontrada.|Issue not found.|Incidencia no encontrada.
Ocorrência não informada.|No issue provided.|No se indicó una incidencia.
Não foi possível carregar a ocorrência|Could not load the issue|No se pudo cargar la incidencia
Essa ocorrência não existe ou não está mais disponível.|This issue does not exist or is no longer available.|Esta incidencia no existe o ya no está disponible.
Carregando ocorrência|Loading issue|Cargando incidencia
Voltar para publicações|Back to posts|Volver a las publicaciones
Etapas da ocorrência|Issue stages|Etapas de la incidencia
Situação atual|Current status|Estado actual
Registrada em|Reported on|Registrada el
Encaminhada em|Forwarded on|Enviada el
Última atualização|Last update|Última actualización
Registro da comunidade|Community record|Registro de la comunidad
Problema|Problem|Problema
Coordenadas|Coordinates|Coordenadas
Evidências do relato|Report evidence|Evidencias del relato
Ainda não há evidências|No evidence yet|Aún no hay evidencias
Adicionar evidências|Add evidence|Añadir evidencias
Adicionar evidência|Add evidence|Añadir evidencia
Nova evidência|New evidence|Nueva evidencia
Descrição da evidência|Evidence description|Descripción de la evidencia
Registre o que você observou|Record what you observed|Registra lo que observaste
Selecionar evidência|Select evidence|Seleccionar evidencia
Evidências adicionadas|Evidence added|Evidencias añadidas
Histórico da ocorrência|Issue history|Historial de la incidencia
Nenhum evento registrado para esta ocorrência.|No events recorded for this issue.|No hay eventos registrados para esta incidencia.
Como você pode contribuir|How you can contribute|Cómo puedes contribuir
Acompanhe a evolução|Track progress|Sigue la evolución
Acompanhe as atualizações|Follow updates|Sigue las actualizaciones
Acompanhamento|Tracking|Seguimiento
Ainda sem resolução|Not yet resolved|Aún sin resolución
Aguardando acompanhamento|Awaiting follow-up|Esperando seguimiento
Ajude a confirmar a solução|Help confirm the solution|Ayuda a confirmar la solución
Com resolução registrada|With recorded resolution|Con resolución registrada
Reabertas|Reopened|Reabiertas
Contestadas|Disputed|Impugnadas
Contestar resolução|Dispute resolution|Impugnar resolución
Reabrir ocorrência|Reopen issue|Reabrir incidencia
Informar resolução|Report resolution|Informar resolución
Descrição da resolução|Resolution description|Descripción de la resolución
Descreva a solução observada.|Describe the solution you observed.|Describe la solución observada.
Descreva a resolução informada.|Describe the reported resolution.|Describe la resolución informada.
Por que você está contestando?|Why are you disputing this?|¿Por qué estás impugnando?
Explique por que o problema continua.|Explain why the problem persists.|Explica por qué el problema continúa.
Motivo da reabertura|Reason for reopening|Motivo de reapertura
Informe por que a ocorrência deve ser reaberta.|Explain why the issue should be reopened.|Explica por qué debe reabrirse la incidencia.
Análise iniciada|Review started|Revisión iniciada
Em análise|Under review|En revisión
Em análise de competência|Agency jurisdiction under review|Competencia del organismo en revisión
Análise de competência iniciada|Jurisdiction review started|Revisión de competencia iniciada
Órgão responsável|Responsible agency|Organismo responsable
Órgão responsável identificado|Responsible agency identified|Organismo responsable identificado
Órgão identificado|Agency identified|Organismo identificado
Órgão sugerido|Suggested agency|Organismo sugerido
Órgão responsável sugerido|Responsible agency suggested|Organismo responsable sugerido
Órgão cadastrado|Registered agency|Organismo registrado
Órgão não identificado|Agency not identified|Organismo no identificado
Órgão ainda não identificado|Agency not yet identified|Organismo aún no identificado
Órgão responsável ainda não identificado|Responsible agency not yet identified|Organismo responsable aún no identificado
Sem órgão identificado|No agency identified|Sin organismo identificado
Empate de órgão responsável|Multiple matching agencies|Varios organismos coincidentes
Mais de um órgão corresponde ao relato. Confira a competência.|More than one agency matches the report. Check jurisdiction.|Más de un organismo corresponde al relato. Comprueba la competencia.
Órgão sem contato válido|Agency without a valid contact|Organismo sin contacto válido
O órgão não possui um contato válido. É necessário revisar o catálogo.|The agency has no valid contact. The directory must be reviewed.|El organismo no tiene un contacto válido. Es necesario revisar el catálogo.
Aguardando identificação do órgão responsável|Awaiting responsible agency identification|Esperando la identificación del organismo responsable
Aguardando encaminhamento|Awaiting forwarding|Esperando envío
Após os 15 minutos de edição, o sistema buscará o órgão responsável e enviará a ocorrência.|After the 15-minute editing period, the system will find the responsible agency and forward the issue.|Tras los 15 minutos de edición, el sistema buscará el organismo responsable y enviará la incidencia.
O sistema está conferindo a localização e a categoria para identificar o órgão responsável.|The system is checking the location and category to identify the responsible agency.|El sistema está comprobando la ubicación y la categoría para identificar al organismo responsable.
Associar órgão|Assign agency|Asignar organismo
Sugerir órgão responsável|Suggest responsible agency|Sugerir organismo responsable
Selecionar e encaminhar|Select and forward|Seleccionar y enviar
Enviar sugestão|Send suggestion|Enviar sugerencia
Selecione um órgão|Select an agency|Selecciona un organismo
Selecione um e-mail|Select an email|Selecciona un correo
Carregando órgãos cadastrados…|Loading registered agencies…|Cargando organismos registrados…
Nenhum órgão cadastrado disponível. A ocorrência continuará aguardando a moderação.|No registered agency available. The issue will continue awaiting moderation.|No hay organismos registrados disponibles. La incidencia seguirá esperando a la moderación.
Selecione um órgão cadastrado e aguarde o período de edição.|Select a registered agency and wait for the editing period.|Selecciona un organismo registrado y espera el período de edición.
Selecione um órgão cadastrado para encaminhar.|Select a registered agency to forward the issue.|Selecciona un organismo registrado para enviar la incidencia.
Selecione um órgão cadastrado para envio por e-mail.|Select a registered agency for email forwarding.|Selecciona un organismo registrado para enviar por correo.
Selecione o órgão e um de seus contatos cadastrados. O documento será gerado automaticamente.|Select the agency and one of its registered contacts. The document will be generated automatically.|Selecciona el organismo y uno de sus contactos registrados. El documento se generará automáticamente.
Informe o nome do órgão responsável.|Enter the responsible agency's name.|Introduce el nombre del organismo responsable.
Órgão responsável associado à ocorrência.|Responsible agency assigned to the issue.|Organismo responsable asignado a la incidencia.
Sugestão de órgão responsável registrada no histórico.|Responsible agency suggestion recorded in the history.|Sugerencia de organismo responsable registrada en el historial.
Encaminhar ao órgão responsável|Forward to responsible agency|Enviar al organismo responsable
Encaminhar por e-mail|Forward by email|Enviar por correo
Encaminhamento registrado|Forwarding recorded|Envío registrado
Encaminhamento enviado por e-mail e registrado no histórico.|Forwarding sent by email and recorded in the history.|Envío realizado por correo y registrado en el historial.
Encaminhamento falhou|Forwarding failed|Error al enviar
Falha no encaminhamento|Forwarding failure|Fallo en el envío
Registrar falha|Record failure|Registrar fallo
Motivo da falha|Reason for failure|Motivo del fallo
Informe o motivo da falha.|Enter the reason for failure.|Introduce el motivo del fallo.
Falha registrada sem alterar o status da ocorrência.|Failure recorded without changing the issue status.|Fallo registrado sin cambiar el estado de la incidencia.
O envio falhou. Confira o histórico antes de tentar novamente.|Sending failed. Check the history before trying again.|El envío falló. Revisa el historial antes de intentarlo de nuevo.
O envio não foi concluído. A moderação verificará o contato e a tentativa registrada.|Sending was not completed. Moderation will check the contact and recorded attempt.|El envío no se completó. La moderación comprobará el contacto y el intento registrado.
O envio por e-mail exige uma ocorrência salva no servidor.|Email forwarding requires an issue saved on the server.|El envío por correo requiere una incidencia guardada en el servidor.
O status será atualizado após a confirmação do envio. Caso o envio falhe, a tentativa ficará registrada para análise.|The status will update after delivery is confirmed. If sending fails, the attempt will be recorded for review.|El estado se actualizará tras confirmar el envío. Si falla, el intento quedará registrado para revisión.
Envio aguardando conferência da moderação|Sending awaiting moderation review|Envío esperando revisión de la moderación
Envio com resultado incerto. Requer conferência técnica antes de reenviar.|Sending outcome uncertain. Technical review required before resending.|Resultado del envío incierto. Se requiere una revisión técnica antes de reenviar.
Processamento aguardando conferência da moderação|Processing awaiting moderation review|Procesamiento esperando revisión de la moderación
Processamento interrompido. Requer conferência técnica.|Processing interrupted. Technical review required.|Procesamiento interrumpido. Se requiere revisión técnica.
Sem retorno após o reenvio|No response after resending|Sin respuesta tras el reenvío
O reenvio já ocorreu e ainda não há resposta.|The issue was already resent and there is still no response.|La incidencia ya se reenvió y aún no hay respuesta.
Aguardamos a resposta do órgão. Se não houver retorno em 15 dias, o sistema fará um único reenvio.|We are awaiting the agency's response. If there is no reply within 15 days, the system will resend once.|Esperamos la respuesta del organismo. Si no responde en 15 días, el sistema hará un único reenvío.
Registrar resposta|Record response|Registrar respuesta
Resposta do órgão|Agency response|Respuesta del organismo
Mensagem recebida|Received message|Mensaje recibido
Transcreva a resposta recebida do órgão responsável.|Transcribe the response from the responsible agency.|Transcribe la respuesta recibida del organismo responsable.
Registre a mensagem recebida. A situação só será classificada após a análise da moderação.|Record the received message. The status will only be classified after moderation review.|Registra el mensaje recibido. El estado solo se clasificará tras la revisión de la moderación.
Protocolo|Reference number|Número de referencia
Protocolo (opcional)|Reference number (optional)|Número de referencia (opcional)
Protocolo recebido|Reference number received|Número de referencia recibido
Código informado pelo órgão|Code provided by the agency|Código indicado por el organismo
Referência da resposta do órgão|Agency response reference|Referencia de la respuesta del organismo
Classificar resposta|Classify response|Clasificar respuesta
Classificação após análise|Classification after review|Clasificación tras la revisión
Justificativa da análise (mínimo de 20 caracteres)|Review justification (minimum 20 characters)|Justificación de la revisión (mínimo 20 caracteres)
Explique como as informações do órgão foram verificadas.|Explain how the agency's information was verified.|Explica cómo se verificó la información del organismo.
Confira a resposta e classifique o resultado.|Check the response and classify the outcome.|Revisa la respuesta y clasifica el resultado.
Resposta registrada|Response recorded|Respuesta registrada
Resposta do órgão registrada|Agency response recorded|Respuesta del organismo registrada
Resposta aguardando análise|Response awaiting review|Respuesta esperando revisión
Resposta em apuração|Response being investigated|Respuesta en investigación
Resposta analisada pela moderação|Response reviewed by moderation|Respuesta revisada por la moderación
Resposta analisada e classificação registrada no histórico.|Response reviewed and classification recorded in the history.|Respuesta revisada y clasificación registrada en el historial.
Resposta registrada e disponível para análise da moderação.|Response recorded and available for moderation review.|Respuesta registrada y disponible para revisión de la moderación.
O registro de resposta exige uma ocorrência salva no servidor.|Recording a response requires an issue saved on the server.|Registrar una respuesta requiere una incidencia guardada en el servidor.
Informe a mensagem recebida do órgão.|Enter the message received from the agency.|Introduce el mensaje recibido del organismo.
Descreva a verificação em pelo menos 20 caracteres.|Describe the verification in at least 20 characters.|Describe la verificación en al menos 20 caracteres.
Análise da moderação necessária|Moderation review required|Revisión de la moderación necesaria
Moderação registrada|Moderation recorded|Moderación registrada
Registrar início da análise|Record review start|Registrar inicio de la revisión
Qual ação foi iniciada?|What action was started?|¿Qué acción se inició?
Descreva a vistoria ou ação iniciada pelo órgão.|Describe the inspection or action started by the agency.|Describe la inspección o acción iniciada por el organismo.
Descreva a ação iniciada em pelo menos 20 caracteres.|Describe the action in at least 20 characters.|Describe la acción en al menos 20 caracteres.
Análise iniciada pelo órgão responsável|Review started by responsible agency|Revisión iniciada por el organismo responsable
Análise iniciada e registrada no histórico.|Review started and recorded in the history.|Revisión iniciada y registrada en el historial.
O órgão responsável iniciou a análise.|The responsible agency started its review.|El organismo responsable inició la revisión.
Responsabilidade assumida pelo órgão e registrada no histórico.|Responsibility accepted by the agency and recorded in the history.|Responsabilidad asumida por el organismo y registrada en el historial.
Resolução registrada|Resolution recorded|Resolución registrada
Resolução informada|Resolution reported|Resolución informada
Resolução confirmada|Resolution confirmed|Resolución confirmada
Resolução contestada|Resolution disputed|Resolución impugnada
Resolução informada e preservada no histórico.|Resolution reported and preserved in the history.|Resolución informada y conservada en el historial.
Resolução validada pela moderação.|Resolution validated by moderation.|Resolución validada por la moderación.
Solução informada; aguardando verificação|Solution reported; awaiting verification|Solución informada; esperando verificación
Solução contestada; aguardando reabertura|Solution disputed; awaiting reopening|Solución impugnada; esperando reapertura
Descreva a verificação da resolução (mínimo de 20 caracteres).|Describe resolution verification (minimum 20 characters).|Describe la verificación de la resolución (mínimo 20 caracteres).
Explique por que a resolução está sendo contestada.|Explain why the resolution is being disputed.|Explica por qué se impugna la resolución.
Contestação registrada e resolução anterior preservada.|Dispute recorded and previous resolution preserved.|Impugnación registrada y resolución anterior conservada.
Confirmação registrada sem alterar o status.|Confirmation recorded without changing the status.|Confirmación registrada sin cambiar el estado.
A ocorrência foi marcada como resolvida.|The issue was marked as resolved.|La incidencia se marcó como resuelta.
A resolução foi validada pela moderação. Se o problema persistir, você pode registrar uma contestação.|The resolution was validated by moderation. If the problem persists, you can file a dispute.|La moderación validó la resolución. Si el problema persiste, puedes registrar una impugnación.
Reaberta para um novo acompanhamento|Reopened for new follow-up|Reabierta para un nuevo seguimiento
Ocorrência reaberta para novo ciclo de acompanhamento.|Issue reopened for a new follow-up cycle.|Incidencia reabierta para un nuevo ciclo de seguimiento.
Informe o motivo da reabertura.|Enter the reason for reopening.|Introduce el motivo de la reapertura.
Ocorrência rejeitada e aguardando reavaliação|Issue rejected and awaiting reassessment|Incidencia rechazada y esperando reevaluación
O órgão rejeitou a ocorrência. Ela precisa de reavaliação.|The agency rejected the issue. It needs reassessment.|El organismo rechazó la incidencia. Necesita reevaluación.
A ocorrência foi rejeitada pelo órgão e está disponível para reavaliação da moderação.|The agency rejected the issue and it is available for moderation reassessment.|El organismo rechazó la incidencia y está disponible para reevaluación de la moderación.
A ocorrência começa aberta. A comunidade pode confirmar o problema e adicionar evidências; a solução precisa ser verificada antes do fechamento.|The issue starts open. The community can confirm the problem and add evidence; the solution must be verified before closure.|La incidencia empieza abierta. La comunidad puede confirmar el problema y añadir evidencias; la solución debe verificarse antes del cierre.
A comunidade pode contribuir com evidências. Todas as atualizações ficam registradas no histórico.|The community can contribute evidence. All updates are recorded in the history.|La comunidad puede aportar evidencias. Todas las actualizaciones quedan registradas en el historial.
A resposta foi recebida. A moderação verificará as informações antes de atualizar a situação.|The response was received. Moderation will verify the information before updating the status.|Se recibió la respuesta. La moderación verificará la información antes de actualizar el estado.
O órgão informou que está trabalhando na solução. Novas respostas serão avaliadas pela moderação.|The agency reported it is working on a solution. New responses will be reviewed by moderation.|El organismo informó que está trabajando en la solución. La moderación evaluará las nuevas respuestas.
Aguardando retorno do órgão. Registre a mensagem quando recebê-la.|Awaiting the agency's response. Record the message when you receive it.|Esperando la respuesta del organismo. Registra el mensaje cuando lo recibas.
Abra os detalhes para acompanhar o status e as próximas ações.|Open details to track status and next actions.|Abre los detalles para seguir el estado y las próximas acciones.
Nenhuma ação disponível para este perfil neste status.|No action available for this profile in this status.|No hay acciones disponibles para este perfil en este estado.
Esta ação não está disponível para seu perfil ou para a situação atual da ocorrência.|This action is unavailable for your profile or the issue's current status.|Esta acción no está disponible para tu perfil o para el estado actual de la incidencia.
Não foi possível executar a ação.|Could not perform the action.|No se pudo realizar la acción.
A ocorrência precisa estar salva no servidor.|The issue must be saved on the server.|La incidencia debe estar guardada en el servidor.
Selecione uma evidência para anexar.|Select evidence to attach.|Selecciona una evidencia para adjuntar.
Evidência adicionada|Evidence added|Evidencia añadida
Evidência adicionada ao histórico.|Evidence added to the history.|Evidencia añadida al historial.
Uma nova evidência foi adicionada à ocorrência.|New evidence was added to the issue.|Se añadió una nueva evidencia a la incidencia.
A ocorrência foi atualizada.|The issue was updated.|La incidencia se actualizó.
A ocorrência voltou ao acompanhamento.|The issue returned to follow-up.|La incidencia volvió al seguimiento.
Um usuário informou que o problema continua existindo.|A user reported that the problem persists.|Un usuario informó que el problema persiste.
A tentativa falhou e pode ser refeita.|The attempt failed and can be retried.|El intento falló y puede repetirse.
O órgão responsável|The responsible agency|El organismo responsable
A comunidade|The community|La comunidad
Um usuário|A user|Un usuario
Um órgão|An agency|Un organismo
Sistema|System|Sistema
Não informado|Not provided|No indicado
Discussão|Discussion|Discusión
01 · Ocorrência rejeitada|01 · Issue rejected|01 · Incidencia rechazada
02 · Ocorrência resolvida|02 · Issue resolved|02 · Incidencia resuelta
03 · Ocorrência em resolução|03 · Issue being resolved|03 · Incidencia en resolución
Prazo expirado|Deadline expired|Plazo vencido
Enviado|Sent|Enviado
ocorrência criada em|issue created on|incidencia creada el
Ainda não encaminhada|Not forwarded yet|Aún no enviada
Atualizando…|Updating…|Actualizando…
BEM-VINDO AO SPECTRUM|WELCOME TO SPECTRUM|BIENVENIDO A SPECTRUM
Bom ter você por aqui.|Good to have you here.|Qué bueno tenerte aquí.
Carregando|Loading|Cargando
Carregando...|Loading...|Cargando...
Carregando cidades...|Loading cities...|Cargando ciudades...
Carregando estados...|Loading states...|Cargando estados...
Cidade não informada|City not provided|Ciudad no indicada
Continuar|Continue|Continuar
Criadas:|Created:|Creadas:
Crie sua conta para acompanhar e transformar seu bairro.|Create your account to follow and transform your neighborhood.|Crea tu cuenta para seguir y transformar tu barrio.
Código informado pelo órgão:|Code provided by the agency:|Código indicado por el organismo:
Denunciar|Report|Denunciar
E-mail cadastrado|Registered email|Correo registrado
Encaminhada|Forwarded|Enviada
Encaminhamento e análise|Forwarding and review|Envío y revisión
Entre para acompanhar o que acontece na sua cidade.|Sign in to follow what's happening in your city.|Inicia sesión para seguir lo que ocurre en tu ciudad.
Entrou em|Joined in|Se unió en
Enviando...|Sending...|Enviando...
Enviando…|Sending…|Enviando…
Excluindo...|Deleting...|Eliminando...
Excluir|Delete|Eliminar
FAÇA PARTE DA COMUNIDADE|JOIN THE COMMUNITY|FORMA PARTE DE LA COMUNIDAD
Localização da publicação|Post location|Ubicación de la publicación
Nenhum arquivo escolhido|No file chosen|Ningún archivo seleccionado
O texto que você escrever aparece aqui em uma prévia limpa.|The text you write appears here in a clean preview.|El texto que escribas aparece aquí en una vista previa limpia.
Ocorrência sem título|Untitled issue|Incidencia sin título
Próxima verificação a partir de|Next check from|Próxima comprobación a partir de
Página|Page|Página
Registrando…|Recording…|Registrando…
Registrar para análise|Record for review|Registrar para revisión
Relato registrado|Report recorded|Relato registrado
Resolução validada|Resolution validated|Resolución validada
Resolvidas:|Resolved:|Resueltas:
Salvo|Saved|Guardado
Selecione|Select|Selecciona
Selecione a cidade|Select the city|Selecciona la ciudad
Selecione o estado|Select the state|Selecciona el estado
Sua participação importa.|Your participation matters.|Tu participación importa.
Também identifiquei este problema|I also noticed this problem|También identifiqué este problema
Ver foto|View photo|Ver foto
Ver vídeo|View video|Ver vídeo
Ver foto da evidência|View evidence photo|Ver foto de la evidencia
Ver vídeo da evidência|View evidence video|Ver vídeo de la evidencia
Ver mais comentários (|View more comments (|Ver más comentarios (
Ver menos comentários|View fewer comments|Ver menos comentarios
Você já confirmou|You already confirmed|Ya confirmaste
anexo|attachment|adjunto
anexos|attachments|adjuntos
atualização|update|actualización
atualizações|updates|actualizaciones
confirmações comunitárias|community confirmations|confirmaciones comunitarias
de|of|de
a|to|a
dias|days|días
sem dados|no data|sin datos
ocorrência(s) encontrada(s)|issue(s) found|incidencia(s) encontrada(s)
ocorrências registradas no período|issues reported in the period|incidencias registradas en el período
% do total|% of total|% del total
% das resolvidas|% of resolved issues|% de las resueltas
resultados|results|resultados
Nenhum estado possui ocorrências para este recorte.|No state has issues for this scope.|Ningún estado tiene incidencias en este alcance.
Nenhuma ocorrência encontrada para os filtros selecionados.|No issues found for the selected filters.|No se encontraron incidencias para los filtros seleccionados.
Novo post|New post|Nueva publicación
Novo Seguidor|New follower|Nuevo seguidor
Alguém que você segue publicou um novo post.|Someone you follow published a new post.|Alguien a quien sigues publicó una nueva publicación.
Você ganhou um novo seguidor!|You have a new follower!|¡Tienes un nuevo seguidor!
Atualização da ocorrência|Issue update|Actualización de la incidencia
Ver perfil de|View profile of|Ver perfil de
Reproduzir vídeo da ocorrência|Play issue video|Reproducir vídeo de la incidencia
Expandir imagem da ocorrência|Expand issue image|Ampliar imagen de la incidencia
Reproduzir vídeo|Play video|Reproducir vídeo
Expandir imagem|Expand image|Ampliar imagen
Entre na sua conta para adicionar evidências.|Sign in to add evidence.|Inicia sesión para añadir evidencias.
Entre na sua conta para associar o órgão.|Sign in to assign the agency.|Inicia sesión para asignar el organismo.
Entre na sua conta para assumir responsabilidade.|Sign in to accept responsibility.|Inicia sesión para asumir la responsabilidad.
Entre na sua conta para confirmar a ocorrência.|Sign in to confirm the issue.|Inicia sesión para confirmar la incidencia.
Entre na sua conta para contestar.|Sign in to dispute.|Inicia sesión para impugnar.
Entre na sua conta para curtir.|Sign in to like.|Inicia sesión para dar me gusta.
Entre na sua conta para descurtir.|Sign in to unlike.|Inicia sesión para quitar me gusta.
Entre na sua conta para encaminhar.|Sign in to forward.|Inicia sesión para enviar.
Entre na sua conta para informar resolução.|Sign in to report resolution.|Inicia sesión para informar la resolución.
Entre na sua conta para iniciar análise.|Sign in to start a review.|Inicia sesión para iniciar la revisión.
Entre na sua conta para reabrir.|Sign in to reopen.|Inicia sesión para reabrir.
Entre na sua conta para reagir.|Sign in to react.|Inicia sesión para reaccionar.
Entre na sua conta para registrar a tentativa.|Sign in to record the attempt.|Inicia sesión para registrar el intento.
Entre na sua conta para remover a foto.|Sign in to remove the photo.|Inicia sesión para eliminar la foto.
Entre na sua conta para repostar.|Sign in to repost.|Inicia sesión para republicar.
Entre na sua conta para resolver.|Sign in to resolve.|Inicia sesión para resolver.
Entre na sua conta para salvar.|Sign in to save.|Inicia sesión para guardar.
Entre na sua conta para sugerir o órgão.|Sign in to suggest an agency.|Inicia sesión para sugerir un organismo.
Publicado em {date}, as {time}|Published on {date}, at {time}|Publicado el {date}, a las {time}
Ocorrência criada em {date}|Issue created on {date}|Incidencia creada el {date}
{count} eventos no histórico|{count} events in the history|{count} eventos en el historial
Última atualização: {event} em {date}|Last update: {event} on {date}|Última actualización: {event} el {date}
Encaminhada para {agency}. Protocolo: {protocol}.|Forwarded to {agency}. Reference: {protocol}.|Enviada a {agency}. Referencia: {protocol}.
Encaminhada para {agency}.|Forwarded to {agency}.|Enviada a {agency}.
{source} informou que o problema foi solucionado.|{source} reported that the problem was solved.|{source} informó que el problema se solucionó.
Referência: {reference}|Reference: {reference}|Referencia: {reference}
{actor} criou esta ocorrência.|{actor} created this issue.|{actor} creó esta incidencia.
{agency} foi identificado como responsável pela ocorrência.|{agency} was identified as responsible for the issue.|Se identificó a {agency} como responsable de la incidencia.
{agency} foi sugerido pela comunidade.|{agency} was suggested by the community.|La comunidad sugirió a {agency}.
Publicado em|Published on|Publicado el
Crítica|Critical|Crítica
A prefeitura informou que o buraco foi consertado, mas ele continua aberto.|The city reported that the pothole was fixed, but it is still there.|El ayuntamiento informó que el bache se reparó, pero sigue abierto.
Remover|Remove|Eliminar
Ir para mídia|Go to media|Ir al medio
Imagem expandida|Expanded image|Imagen ampliada
Ocorrência criada.|Issue created.|Incidencia creada.
Um usuário confirmou que também identificou o problema.|A user confirmed they also noticed the problem.|Un usuario confirmó que también identificó el problema.
Um órgão responsável foi identificado.|A responsible agency was identified.|Se identificó un organismo responsable.
Um órgão responsável foi sugerido pela comunidade.|A responsible agency was suggested by the community.|La comunidad sugirió un organismo responsable.
A ocorrência foi encaminhada ao órgão responsável.|The issue was forwarded to the responsible agency.|La incidencia se envió al organismo responsable.
A tentativa de encaminhamento falhou. Uma nova tentativa pode ser feita.|The forwarding attempt failed. You can try again.|El intento de envío falló. Puedes intentarlo de nuevo.
O órgão responsável iniciou a análise da ocorrência.|The responsible agency started reviewing the issue.|El organismo responsable inició la revisión de la incidencia.
Foi informado que o problema foi solucionado.|The problem was reported as solved.|Se informó que el problema se solucionó.
Um usuário contestou a resolução.|A user disputed the resolution.|Un usuario impugnó la resolución.
A ocorrência voltou ao fluxo de acompanhamento.|The issue returned to the follow-up process.|La incidencia volvió al proceso de seguimiento.
notificações não lidas|unread notifications|notificaciones sin leer
As novas ocorrências aparecerão aqui. Use Atualizar para consultar o servidor.|New issues will appear here. Use Refresh to check the server.|Las nuevas incidencias aparecerán aquí. Usa Actualizar para consultar el servidor.
Criar a primeira ocorrência|Create the first issue|Crear la primera incidencia
Experimente outra categoria ou situação para explorar os relatos.|Try another category or status to explore reports.|Prueba otra categoría o estado para explorar los relatos.
Feito|Done|Hecho
Nenhum relato com esses filtros|No reports match these filters|No hay relatos con estos filtros
Nenhum resultado neste filtro|No results for this filter|No hay resultados con este filtro
Nenhuma ocorrência para acompanhar|No issues to follow|No hay incidencias para seguir
Nenhuma publicação por aqui|No posts here|No hay publicaciones aquí
Publicando ocorrência|Publishing issue|Publicando incidencia
Quando alguém publicar nessa cidade, o conteúdo aparece aqui.|When someone posts in this city, the content will appear here.|Cuando alguien publique en esta ciudad, el contenido aparecerá aquí.
Remover repost|Remove repost|Eliminar republicación
Repostar publicação|Repost|Republicar
Salvando|Saving|Guardando
Sua cidade tem espaço para a sua voz|Your city has room for your voice|Tu ciudad tiene espacio para tu voz
Tente outra busca ou selecione Todas.|Try another search or select All.|Prueba otra búsqueda o selecciona Todas.
Um registro pode ser o primeiro passo para melhorar o seu bairro.|A report can be the first step toward improving your neighborhood.|Un registro puede ser el primer paso para mejorar tu barrio.
Ver no feed|View in feed|Ver en el feed
Concluindo seu login com Google...|Completing your Google sign-in...|Completando tu inicio de sesión con Google...
Não foi possível entrar com Google|Could not sign in with Google|No se pudo iniciar sesión con Google
`;
export const TRANSLATIONS: ReadonlyMap<string, readonly [string, string]> = new Map(
  rows.trim().split('\n').filter(Boolean).map((row) => {
    const [source, english, spanish] = row.split('|');
    return [normalizeText(source), [english, spanish] as const];
  }),
);
