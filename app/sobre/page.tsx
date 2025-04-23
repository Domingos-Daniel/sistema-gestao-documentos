import PublicLayout from "@/components/public-layout"
import Link from "next/link" // Import Link
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" // Import Card components
import { ListChecks, Search, Users, Mail } from "lucide-react" // Import icons

export default function AboutPage() {
  return (
    <PublicLayout title="Sobre o Repositório" description="Conheça mais sobre nosso repositório acadêmico">
      <div className="space-y-8 max-w-4xl mx-auto"> {/* Added max-width and spacing */}

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Bem-vindo ao Repositório Acadêmico</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm sm:prose lg:prose-lg max-w-none"> {/* Use prose within CardContent */}
            <p>
              Esta é uma plataforma dedicada à centralização e disseminação do conhecimento produzido no âmbito acadêmico. Nosso objetivo é fornecer acesso facilitado a uma ampla variedade de documentos, incluindo artigos científicos, teses, dissertações, trabalhos de conclusão de curso e outros materiais de pesquisa relevantes.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8"> {/* Grid for Mission/Vision */}
          <Card>
            <CardHeader>
              <CardTitle>Nossa Missão</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm sm:prose lg:prose-lg max-w-none">
              <p>
                Democratizar o acesso ao conhecimento acadêmico, quebrando barreiras e facilitando a busca, o acesso e o compartilhamento de produções científicas e intelectuais para estudantes, professores, pesquisadores e a comunidade em geral.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Nossa Visão</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm sm:prose lg:prose-lg max-w-none">
              <p>
                Ser a principal referência como repositório digital, reconhecido pela qualidade, abrangência e facilidade de uso, contribuindo ativamente para o avanço da ciência e da educação.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" /> {/* Icon */}
              Recursos Principais
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm sm:prose lg:prose-lg max-w-none">
            <ul>
              <li><strong>Vasto Acervo:</strong> Acesso a documentos acadêmicos em diversas áreas do conhecimento.</li>
              <li><strong>Organização Intuitiva:</strong> Navegação facilitada por categorias temáticas.</li>
              <li><strong>Busca Eficiente:</strong> Encontre documentos específicos por título, descrição ou tags.</li>
              <li><strong>Acesso Livre:</strong> Download gratuito de todos os documentos disponíveis.</li>
              <li><strong>Interface Moderna:</strong> Experiência de usuário agradável em qualquer dispositivo.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" /> {/* Icon */}
              Como Utilizar
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm sm:prose lg:prose-lg max-w-none">
            <p>
              Explore nosso acervo navegando pela página de{' '}
              {/* Use Link component */}
              <Link href="/documentos" className="text-primary hover:underline">
                Documentos
              </Link>
              , ou filtre por áreas de interesse nas{' '}
              <Link href="/categorias" className="text-primary hover:underline">
                Categorias
              </Link>
              . Utilize a barra de busca no topo da página para encontrar rapidamente o que procura.
            </p>
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> {/* Icon */}
              Para Quem?
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm sm:prose lg:prose-lg max-w-none">
            <p>
              Este repositório é destinado a todos que buscam conhecimento acadêmico confiável:
            </p>
             <ul>
              <li>Estudantes de graduação e pós-graduação</li>
              <li>Professores e Educadores</li>
              <li>Pesquisadores e Cientistas</li>
              <li>Profissionais buscando atualização</li>
              <li>Curiosos e entusiastas do saber</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" /> {/* Icon */}
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm sm:prose lg:prose-lg max-w-none">
            <p>
              Sua opinião é importante! Para mais informações, sugestões, reporte de erros ou dúvidas, entre em contato conosco através do email:{' '}
              <a href="mailto:contato@repositorioacademico.com" className="text-primary hover:underline">
                contato@repositorioacademico.com
              </a>
            </p>
          </CardContent>
        </Card>

      </div>
    </PublicLayout>
  )
}

