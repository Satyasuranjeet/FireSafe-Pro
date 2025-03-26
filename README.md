# Fire Safety Training Platform

## Use-Case Diagram

The following diagram illustrates the main use cases of the fire safety training platform:

```mermaid
graph LR
    actor Staff -->> UseCase1
    actor Staff -->> UseCase2
    actor Staff -->> UseCase3
    actor Admin -->> UseCase4
    actor Admin -->> UseCase5

    UseCase1(Access Training Modules)
    UseCase2(Interact with AI Chat Assistant)
    UseCase3(Participate in Fire Safety Simulations)
    UseCase4(Manage Training Content)
    UseCase5(View Training Reports)

    style Staff fill:#f9f,stroke:#333,stroke-width:2px
    style Admin fill:#ccf,stroke:#333,stroke-width:2px
```

**Actors:**

*   **Staff:** Hotel staff members who participate in the training.
*   **Admin:** Hotel administrators or training managers who manage the platform.

**Use Cases:**

*   **Access Training Modules:** Staff can access AI-generated reading materials and MCQ assignments.
*   **Interact with AI Chat Assistant:** Staff can ask questions and receive immediate answers from the AI assistant.
*   **Participate in Fire Safety Simulations:** Staff can engage in interactive fire safety simulations (future feature).
*   **Manage Training Content:** Admins can create, update, and manage training modules.
*   **View Training Reports:** Admins can view reports on staff training progress and performance.

## Architecture Diagram

The following diagram illustrates the high-level architecture of the fire safety training platform:

```mermaid
graph LR
    subgraph Client
        Staff[Staff Member]
        Admin[Admin User]
    end

    subgraph "API Gateway"
        API[API Gateway]
    end

    subgraph "Backend Services"
        Content[Content Generation Service]
        Chat[Chat Assistant Service]
        Auth[Authentication Service]
        Simulation[Simulation Service (Future)]
        Reporting[Reporting Service (Future)]
    end

    subgraph "Data Storage"
        DB[Database (User Data, Training Data, Progress)]
    end

    Client -->> API
    API -->> Content
    API -->> Chat
    API -->> Auth
    API -->> Simulation
    API -->> Reporting

    Content -->> DB
    Chat -->> DB
    Auth -->> DB
    Simulation -->> DB
    Reporting -->> DB
```

**Components:**

*   **Client:** Represents the staff members and admin users interacting with the platform.
*   **API Gateway:** Handles incoming requests and routes them to the appropriate backend services.
*   **Backend Services:**
    *   **Content Generation Service:** Generates training modules (reading materials, MCQs).
    *   **Chat Assistant Service:** Provides the AI-powered chat interface.
    *   **Authentication Service:** Handles user authentication and authorization.
    *   **Simulation Service (Future):** Manages interactive fire safety simulations.
    *   **Reporting Service (Future):** Generates reports on training progress and performance.
*   **Data Storage:** Stores user data, training content, progress, and performance data.

## Technologies Used

*   **Backend:** Python (Flask)
*   **AI Model:** Gemini API (integrated for content generation and chat assistant)
*   **Authentication:** JWT (JSON Web Tokens)
*   **Database:** MongoDB
*   **Frontend:**React
*   **Development Environment:** IDX (for building and deploying the project)
*   **Diagrams:** Mermaid.js

## Additional Details/Future Development

*   **Integration of Fire Safety Simulation Service:** Develop and integrate the simulation service to provide interactive training scenarios.
*   **Implementation of Personalized Learning Paths:** Implement algorithms to analyze user performance and tailor the training path accordingly.
*   **Development of Real-Time Feedback Mechanisms:** Add real-time feedback to simulations and assessments to enhance learning.
*   **Enhanced Reporting and Analytics:** Expand reporting capabilities to provide more detailed insights into training effectiveness.
*   **Gamification Elements:** Incorporate gamification to increase user engagement and motivation.
*   **Mobile App Development:** Create a mobile app for convenient access to training materials and the AI assistant.
*   **Multilingual Support:** Add support for multiple languages to accommodate diverse staff.
*   **Safety Feedback Implementation:** Implement safety feedback mechanisms to ensure responsible AI usage.
