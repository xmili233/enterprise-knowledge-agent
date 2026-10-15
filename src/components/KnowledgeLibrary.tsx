import { useRef, useState } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FolderIcon, DocumentIcon } from "@/components/FileIcons";
import { docsForBase, knowledgeBases } from "@/data/knowledge";
import "./knowledge-library.css";

export function KnowledgeLibrary({
  onOpenDocument,
}: {
  onOpenDocument: (id: string) => void;
}) {
  const [filter, setFilter] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const folder = knowledgeBases.find((base) => base.id === folderId);
  const query = filter.trim();
  const visibleFolders = folder ? [] : knowledgeBases.filter(
    (base) => `${base.name}${base.description}`.includes(query),
  );
  const visibleDocuments = docsForBase(folderId).filter((doc) => doc.title.includes(query));
  const resultCount = visibleFolders.length + visibleDocuments.length;

  function openFolder(id: string) {
    setFolderId(id);
    setFilter("");
    requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
  }

  function closeFolder() {
    const previousFolder = folderId;
    setFolderId(null);
    setFilter("");
    requestAnimationFrame(() => {
      document.getElementById(`folder-${previousFolder}`)?.focus({ preventScroll: true });
    });
  }

  return (
    <section className="knowledge-section" aria-labelledby="knowledge-title">
      <div className="library-toolbar" data-folder={!!folder}>
        {folder ? (
          <nav className="library-path" aria-label="文件夹路径">
            <button onClick={closeFolder} aria-label="返回企业知识库">知识库</button>
            <ChevronRight size={14} strokeWidth={1.5} aria-hidden="true" />
            <h2 id="knowledge-title" ref={headingRef} tabIndex={-1} title={folder.name} aria-current="page">
              {folder.name}
            </h2>
          </nav>
        ) : (
          <h2 className="library-title" id="knowledge-title" ref={headingRef} tabIndex={-1}>
            企业知识库
          </h2>
        )}
        <label className="library-search">
          <Search size={15} strokeWidth={1.7} aria-hidden="true" />
          <span className="sr-only">搜索文件或文件夹</span>
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="搜索文件或文件夹"
          />
          {filter && (
            <button aria-label="清除搜索" onClick={() => setFilter("")}>
              <X size={14} />
            </button>
          )}
        </label>
      </div>
      <ul className="file-grid" aria-label={folder ? `${folder.name}中的内容` : "知识库文件和文件夹"}>
        {visibleFolders.map((base) => (
          <li key={base.id}>
            <button
              id={`folder-${base.id}`}
              className="file-item"
              onClick={() => openFolder(base.id)}
              aria-label={`打开${base.name}文件夹`}
              title={base.description}
            >
              <span className="file-icon"><FolderIcon /></span>
              <span className="file-name">{base.name}</span>
              <span className="file-detail">{docsForBase(base.id).length} 份文件</span>
            </button>
          </li>
        ))}
        {visibleDocuments.map((doc) => (
          <li key={doc.id}>
            <button
              className="file-item"
              onClick={() => onOpenDocument(doc.id)}
              aria-label={`打开${doc.title}`}
              title={`${doc.title} · v${doc.version} · ${doc.updated}`}
            >
              <span className="file-icon"><DocumentIcon /></span>
              <span className="file-name">{doc.title}</span>
              <span className="file-detail">v{doc.version} · {doc.updated}</span>
            </button>
          </li>
        ))}
      </ul>
      {resultCount === 0 && (
        <div className="empty-state">
          <h3>没有找到文件或文件夹</h3>
          <p>换一个关键词，或查看全部内容。</p>
          <Button variant="outline" onClick={() => setFilter("")}>查看全部内容</Button>
        </div>
      )}
      <span className="sr-only" role="status">
        {visibleFolders.length} 个文件夹，{visibleDocuments.length} 份文件
      </span>
    </section>
  );
}
