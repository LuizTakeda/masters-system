import { useParams } from "react-router";
import PageHeader from "../components/page-header";

export default function ProjectHomePage() {
  const { project } = useParams<{ project: string }>();

  return (
    <main>
      <PageHeader>
        {project?.replace("-", " ")}
      </PageHeader>
    </main>
  );
}