"use client";

import { useState } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { ProjectSelect } from "./components/ProjectSelect";
import { BlueprintBoard } from "./components/board";
import type { Project, AuthUser } from "@/types";

export default function Home() {
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

    // 1. 로그인 안됨 → 로그인 화면
    if (!user) {
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    // 2. 로그인됨, 프로젝트 미선택 → 프로젝트 선택 화면
    if (!selectedProject) {
        return (
            <ProjectSelect
                user={user}
                onSelectProject={handleSelectProject}
                onLogout={handleLogout}
            />
        );
    }

    // 3. 프로젝트 선택됨 → 블루프린트 보드
    return (
        <BlueprintBoard
            project={selectedProject}
            onBack={handleBackToProjects}
        />
    );
}
