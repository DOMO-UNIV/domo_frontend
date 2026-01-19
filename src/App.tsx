
'use client';

import React, { useState } from 'react';
import { LoginScreen } from './app/components/LoginScreen';
import { ProjectSelect } from './app/components/ProjectSelect';
import { WorkspaceBoard } from './app/components/WorkspaceBoard';

import { AuthUser, Project } from './types/index';

export const App = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleLoginSuccess = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedProject(null);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  // 1. 로그인 안됨 -> 로그인 화면 표시
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. 로그인 됨 & 프로젝트 미선택 -> 프로젝트 선택 화면 표시
  if (!selectedProject) {
    return (
      <ProjectSelect
        user={user}
        onSelectProject={handleSelectProject}
        onLogout={handleLogout}
      />
    );
  }

  // 3. 프로젝트 선택됨 -> 메인 워크스페이스 보드 표시
  return (
    <div className="h-screen w-full overflow-hidden">
      <WorkspaceBoard
        project={selectedProject}
        onBack={handleBackToProjects}
      />
    </div>
  );
};
