import modal
from datetime import datetime

# Create a Modal app
app = modal.App("manim-course-generator")

# Define the image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "ffmpeg", 
        "libcairo2-dev", 
        "libpango1.0-dev", 
        "texlive", 
        "texlive-latex-extra",
        "sox",
    )
    .pip_install(
        "manim", 
        "manim-voiceover[elevenlabs,transcribe]",
        "boto3",
        "fastapi[standard]",
        "google-generativeai",
    )
)

manimDocs = """
## Manim Index Documentation

This reference list details modules, functions, and variables included in Manim, describing what they are and what they do.

- [Animations](reference_index/animations.html)
  - [animation](reference/manim.animation.animation.html)
    - [Animation](reference/manim.animation.animation.Animation.html)
    - [Wait](reference/manim.animation.animation.Wait.html)
    - [override_animation()](reference/manim.animation.animation.html#manim.animation.animation.override_animation)
    - [prepare_animation()](reference/manim.animation.animation.html#manim.animation.animation.prepare_animation)
  - [changing](reference/manim.animation.changing.html)
    - [AnimatedBoundary](reference/manim.animation.changing.AnimatedBoundary.html)
    - [TracedPath](reference/manim.animation.changing.TracedPath.html)
  - [composition](reference/manim.animation.composition.html)
    - [AnimationGroup](reference/manim.animation.composition.AnimationGroup.html)
    - [LaggedStart](reference/manim.animation.composition.LaggedStart.html)
    - [LaggedStartMap](reference/manim.animation.composition.LaggedStartMap.html)
    - [Succession](reference/manim.animation.composition.Succession.html)
  - [creation](reference/manim.animation.creation.html)
    - [AddTextLetterByLetter](reference/manim.animation.creation.AddTextLetterByLetter.html)
    - [AddTextWordByWord](reference/manim.animation.creation.AddTextWordByWord.html)
    - [Create](reference/manim.animation.creation.Create.html)
    - [DrawBorderThenFill](reference/manim.animation.creation.DrawBorderThenFill.html)
    - [RemoveTextLetterByLetter](reference/manim.animation.creation.RemoveTextLetterByLetter.html)
    - [ShowIncreasingSubsets](reference/manim.animation.creation.ShowIncreasingSubsets.html)
    - [ShowPartial](reference/manim.animation.creation.ShowPartial.html)
    - [ShowSubmobjectsOneByOne](reference/manim.animation.creation.ShowSubmobjectsOneByOne.html)
    - [SpiralIn](reference/manim.animation.creation.SpiralIn.html)
    - [Uncreate](reference/manim.animation.creation.Uncreate.html)
    - [Unwrite](reference/manim.animation.creation.Unwrite.html)
    - [Write](reference/manim.animation.creation.Write.html)
  - [fading](reference/manim.animation.fading.html)
    - [FadeIn](reference/manim.animation.fading.FadeIn.html)
    - [FadeOut](reference/manim.animation.fading.FadeOut.html)
  - [growing](reference/manim.animation.growing.html)
    - [GrowArrow](reference/manim.animation.growing.GrowArrow.html)
    - [GrowFromCenter](reference/manim.animation.growing.GrowFromCenter.html)
    - [GrowFromEdge](reference/manim.animation.growing.GrowFromEdge.html)
    - [GrowFromPoint](reference/manim.animation.growing.GrowFromPoint.html)
    - [SpinInFromNothing](reference/manim.animation.growing.SpinInFromNothing.html)
  - [indication](reference/manim.animation.indication.html)
    - [ApplyWave](reference/manim.animation.indication.ApplyWave.html)
    - [Circumscribe](reference/manim.animation.indication.Circumscribe.html)
    - [Flash](reference/manim.animation.indication.Flash.html)
    - [FocusOn](reference/manim.animation.indication.FocusOn.html)
    - [Indicate](reference/manim.animation.indication.Indicate.html)
    - [ShowPassingFlash](reference/manim.animation.indication.ShowPassingFlash.html)
    - [ShowPassingFlashWithThinningStrokeWidth](reference/manim.animation.indication.ShowPassingFlashWithThinningStrokeWidth.html)
    - [Wiggle](reference/manim.animation.indication.Wiggle.html)
  - [movement](reference/manim.animation.movement.html)
    - [ComplexHomotopy](reference/manim.animation.movement.ComplexHomotopy.html)
    - [Homotopy](reference/manim.animation.movement.Homotopy.html)
    - [MoveAlongPath](reference/manim.animation.movement.MoveAlongPath.html)
    - [PhaseFlow](reference/manim.animation.movement.PhaseFlow.html)
    - [SmoothedVectorizedHomotopy](reference/manim.animation.movement.SmoothedVectorizedHomotopy.html)
  - [numbers](reference/manim.animation.numbers.html)
    - [ChangeDecimalToValue](reference/manim.animation.numbers.ChangeDecimalToValue.html)
    - [ChangingDecimal](reference/manim.animation.numbers.ChangingDecimal.html)
  - [rotation](reference/manim.animation.rotation.html)
    - [Rotate](reference/manim.animation.rotation.Rotate.html)
    - [Rotating](reference/manim.animation.rotation.Rotating.html)
  - [specialized](reference/manim.animation.specialized.html)
    - [Broadcast](reference/manim.animation.specialized.Broadcast.html)
  - [speedmodifier](reference/manim.animation.speedmodifier.html)
    - [ChangeSpeed](reference/manim.animation.speedmodifier.ChangeSpeed.html)
  - [transform](reference/manim.animation.transform.html)
    - [ApplyComplexFunction](reference/manim.animation.transform.ApplyComplexFunction.html)
    - [ApplyFunction](reference/manim.animation.transform.ApplyFunction.html)
    - [ApplyMatrix](reference/manim.animation.transform.ApplyMatrix.html)
    - [ApplyMethod](reference/manim.animation.transform.ApplyMethod.html)
    - [ApplyPointwiseFunction](reference/manim.animation.transform.ApplyPointwiseFunction.html)
    - [ApplyPointwiseFunctionToCenter](reference/manim.animation.transform.ApplyPointwiseFunctionToCenter.html)
    - [ClockwiseTransform](reference/manim.animation.transform.ClockwiseTransform.html)
    - [CounterclockwiseTransform](reference/manim.animation.transform.CounterclockwiseTransform.html)
    - [CyclicReplace](reference/manim.animation.transform.CyclicReplace.html)
    - [FadeToColor](reference/manim.animation.transform.FadeToColor.html)
    - [FadeTransform](reference/manim.animation.transform.FadeTransform.html)
    - [FadeTransformPieces](reference/manim.animation.transform.FadeTransformPieces.html)
    - [MoveToTarget](reference/manim.animation.transform.MoveToTarget.html)
    - [ReplacementTransform](reference/manim.animation.transform.ReplacementTransform.html)
    - [Restore](reference/manim.animation.transform.Restore.html)
    - [ScaleInPlace](reference/manim.animation.transform.ScaleInPlace.html)
    - [ShrinkToCenter](reference/manim.animation.transform.ShrinkToCenter.html)
    - [Swap](reference/manim.animation.transform.Swap.html)
    - [Transform](reference/manim.animation.transform.Transform.html)
    - [TransformAnimations](reference/manim.animation.transform.TransformAnimations.html)
    - [TransformFromCopy](reference/manim.animation.transform.TransformFromCopy.html)
  - [transform_matching_parts](reference/manim.animation.transform_matching_parts.html)
    - [TransformMatchingAbstractBase](reference/manim.animation.transform_matching_parts.TransformMatchingAbstractBase.html)
    - [TransformMatchingShapes](reference/manim.animation.transform_matching_parts.TransformMatchingShapes.html)
    - [TransformMatchingTex](reference/manim.animation.transform_matching_parts.TransformMatchingTex.html)
  - [updaters](reference/manim.animation.updaters.html)
    - [Modules](reference/manim.animation.updaters.html#modules)
- [Cameras](reference_index/cameras.html)
  - [camera](reference/manim.camera.camera.html)
    - [BackgroundColoredVMobjectDisplayer](reference/manim.camera.camera.BackgroundColoredVMobjectDisplayer.html)
    - [Camera](reference/manim.camera.camera.Camera.html)
  - [mapping_camera](reference/manim.camera.mapping_camera.html)
    - [MappingCamera](reference/manim.camera.mapping_camera.MappingCamera.html)
    - [OldMultiCamera](reference/manim.camera.mapping_camera.OldMultiCamera.html)
    - [SplitScreenCamera](reference/manim.camera.mapping_camera.SplitScreenCamera.html)
  - [moving_camera](reference/manim.camera.moving_camera.html)
    - [MovingCamera](reference/manim.camera.moving_camera.MovingCamera.html)
  - [multi_camera](reference/manim.camera.multi_camera.html)
    - [MultiCamera](reference/manim.camera.multi_camera.MultiCamera.html)
  - [three_d_camera](reference/manim.camera.three_d_camera.html)
    - [ThreeDCamera](reference/manim.camera.three_d_camera.ThreeDCamera.html)
- [Configuration](reference_index/configuration.html)
  - [Module Index](reference_index/configuration.html#module-index)
    - [\_config](reference/manim._config.html)
    - [utils](reference/manim._config.utils.html)
    - [logger_utils](reference/manim._config.logger_utils.html)
- [Mobjects](reference_index/mobjects.html)
  - [frame](reference/manim.mobject.frame.html)
    - [FullScreenRectangle](reference/manim.mobject.frame.FullScreenRectangle.html)
    - [ScreenRectangle](reference/manim.mobject.frame.ScreenRectangle.html)
  - [geometry](reference/manim.mobject.geometry.html)
    - [Modules](reference/manim.mobject.geometry.html#modules)
  - [graph](reference/manim.mobject.graph.html)
    - [NxGraph](reference/manim.mobject.graph.html#manim.mobject.graph.NxGraph)
    - [DiGraph](reference/manim.mobject.graph.DiGraph.html)
    - [GenericGraph](reference/manim.mobject.graph.GenericGraph.html)
    - [Graph](reference/manim.mobject.graph.Graph.html)
    - [LayoutFunction](reference/manim.mobject.graph.LayoutFunction.html)
  - [graphing](reference/manim.mobject.graphing.html)
    - [Modules](reference/manim.mobject.graphing.html#modules)
  - [logo](reference/manim.mobject.logo.html)
    - [ManimBanner](reference/manim.mobject.logo.ManimBanner.html)
  - [matrix](reference/manim.mobject.matrix.html)
    - [DecimalMatrix](reference/manim.mobject.matrix.DecimalMatrix.html)
    - [IntegerMatrix](reference/manim.mobject.matrix.IntegerMatrix.html)
    - [Matrix](reference/manim.mobject.matrix.Matrix.html)
    - [MobjectMatrix](reference/manim.mobject.matrix.MobjectMatrix.html)
    - [get_det_text()](reference/manim.mobject.matrix.html#manim.mobject.matrix.get_det_text)
    - [matrix_to_mobject()](reference/manim.mobject.matrix.html#manim.mobject.matrix.matrix_to_mobject)
    - [matrix_to_tex_string()](reference/manim.mobject.matrix.html#manim.mobject.matrix.matrix_to_tex_string)
  - [mobject](reference/manim.mobject.mobject.html)
    - [TimeBasedUpdater](reference/manim.mobject.mobject.html#manim.mobject.mobject.TimeBasedUpdater)
    - [NonTimeBasedUpdater](reference/manim.mobject.mobject.html#manim.mobject.mobject.NonTimeBasedUpdater)
    - [Updater](reference/manim.mobject.mobject.html#manim.mobject.mobject.Updater)
    - [Group](reference/manim.mobject.mobject.Group.html)
    - [Mobject](reference/manim.mobject.mobject.Mobject.html)
    - [override_animate()](reference/manim.mobject.mobject.html#manim.mobject.mobject.override_animate)
  - [svg](reference/manim.mobject.svg.html)
    - [Modules](reference/manim.mobject.svg.html#modules)
  - [table](reference/manim.mobject.table.html)
    - [DecimalTable](reference/manim.mobject.table.DecimalTable.html)
    - [IntegerTable](reference/manim.mobject.table.IntegerTable.html)
    - [MathTable](reference/manim.mobject.table.MathTable.html)
    - [MobjectTable](reference/manim.mobject.table.MobjectTable.html)
    - [Table](reference/manim.mobject.table.Table.html)
  - [text](reference/manim.mobject.text.html)
    - [Modules](reference/manim.mobject.text.html#modules)
  - [three_d](reference/manim.mobject.three_d.html)
    - [Modules](reference/manim.mobject.three_d.html#modules)
  - [types](reference/manim.mobject.types.html)
    - [Modules](reference/manim.mobject.types.html#modules)
  - [utils](reference/manim.mobject.utils.html)
    - [get_mobject_class()](reference/manim.mobject.utils.html#manim.mobject.utils.get_mobject_class)
    - [get_point_mobject_class()](reference/manim.mobject.utils.html#manim.mobject.utils.get_point_mobject_class)
    - [get_vectorized_mobject_class()](reference/manim.mobject.utils.html#manim.mobject.utils.get_vectorized_mobject_class)
  - [value_tracker](reference/manim.mobject.value_tracker.html)
    - [ComplexValueTracker](reference/manim.mobject.value_tracker.ComplexValueTracker.html)
    - [ValueTracker](reference/manim.mobject.value_tracker.ValueTracker.html)
  - [vector_field](reference/manim.mobject.vector_field.html)
    - [ArrowVectorField](reference/manim.mobject.vector_field.ArrowVectorField.html)
    - [StreamLines](reference/manim.mobject.vector_field.StreamLines.html)
    - [VectorField](reference/manim.mobject.vector_field.VectorField.html)
- [Scenes](reference_index/scenes.html)
  - [moving_camera_scene](reference/manim.scene.moving_camera_scene.html)
    - [MovingCameraScene](reference/manim.scene.moving_camera_scene.MovingCameraScene.html)
  - [section](reference/manim.scene.section.html)
    - [DefaultSectionType](reference/manim.scene.section.DefaultSectionType.html)
    - [Section](reference/manim.scene.section.Section.html)
  - [scene](reference/manim.scene.scene.html)
    - [RerunSceneHandler](reference/manim.scene.scene.RerunSceneHandler.html)
    - [Scene](reference/manim.scene.scene.Scene.html)
  - [scene_file_writer](reference/manim.scene.scene_file_writer.html)
    - [SceneFileWriter](reference/manim.scene.scene_file_writer.SceneFileWriter.html)
  - [three_d_scene](reference/manim.scene.three_d_scene.html)
    - [SpecialThreeDScene](reference/manim.scene.three_d_scene.SpecialThreeDScene.html)
    - [ThreeDScene](reference/manim.scene.three_d_scene.ThreeDScene.html)
  - [vector_space_scene](reference/manim.scene.vector_space_scene.html)
    - [LinearTransformationScene](reference/manim.scene.vector_space_scene.LinearTransformationScene.html)
    - [VectorScene](reference/manim.scene.vector_space_scene.VectorScene.html)
  - [zoomed_scene](reference/manim.scene.zoomed_scene.html)
    - [ZoomedScene](reference/manim.scene.zoomed_scene.ZoomedScene.html)
- [Utilities and other modules](reference_index/utilities_misc.html)
  - [Module Index](reference_index/utilities_misc.html#module-index)
    - [bezier](reference/manim.utils.bezier.html)
    - [color](reference/manim.utils.color.html)
    - [commands](reference/manim.utils.commands.html)
    - [config_ops](reference/manim.utils.config_ops.html)
    - [constants](reference/manim.constants.html)
    - [debug](reference/manim.utils.debug.html)
    - [deprecation](reference/manim.utils.deprecation.html)
    - [docbuild](reference/manim.utils.docbuild.html)
    - [hashing](reference/manim.utils.hashing.html)
    - [images](reference/manim.utils.images.html)
    - [ipython_magic](reference/manim.utils.ipython_magic.html)
    - [iterables](reference/manim.utils.iterables.html)
    - [paths](reference/manim.utils.paths.html)
    - [rate_functions](reference/manim.utils.rate_functions.html)
    - [simple_functions](reference/manim.utils.simple_functions.html)
    - [sounds](reference/manim.utils.sounds.html)
    - [space_ops](reference/manim.utils.space_ops.html)
    - [testing](reference/manim.utils.testing.html)
    - [tex](reference/manim.utils.tex.html)
    - [tex_file_writing](reference/manim.utils.tex_file_writing.html)
    - [tex_templates](reference/manim.utils.tex_templates.html)
    - [typing](reference/manim.typing.html)
"""

# System prompt for generating Manim animations with voiceover
SYSTEM_PROMPT = """
You are an expert educational animator specializing in creating clear, engaging Manim animations for STEM subjects.

# CRITICAL REQUIREMENTS

1. **Class Name**: MUST be named exactly `CourseScene` (not GenScene, MyScene, or anything else)
2. **Duration**: Total video MUST be approximately 60 seconds
3. **Code Only**: Return ONLY executable Python code - NO markdown fences, NO explanations, NO text before/after
4. **No External Files**: NEVER reference images, SVGs, or external assets that don't exist

# REQUIRED CODE STRUCTURE

```python
from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.elevenlabs import ElevenLabsService

class CourseScene(VoiceoverScene):
    def construct(self):
        # Initialize ElevenLabs voiceover service
        self.set_speech_service(
            ElevenLabsService(
                voice_id="KHla1Z0y3pZPYrqfub7h",
                voice_settings={"stability": 0.001, "similarity_boost": 0.25},
                transcription_model=None,
            )
        )
        
        # Animation code with synchronized voiceovers
        with self.voiceover(text="Your narration here") as tracker:
            self.play(Create(object), run_time=tracker.duration)
```

# Visual Representations by Subject

Mathematics: Use MathTex for equations, Axes for graphs, geometric shapes (Circle, Square, Polygon), NumberLine, coordinate systems
Physics: Arrow for forces/vectors, Dot/Circle for particles, Line for waves, motion paths, vector fields
Chemistry: Circle for atoms (connected with Line), Transform for reactions, Tex for chemical formulas
Biology: Custom shapes using VGroup, Line for DNA helixes, Rectangle/Circle for cell structures
Computer Science: Rectangle for arrays, Dot+Line for trees/graphs, Text with arrows for algorithms
Engineering: Rectangle/Line for diagrams, Circle+Line for circuits, Arrow for flowcharts

# Programming Rules

Always use comments to explain what the next line does:
Example: # Create a sphere of color BLUE for the Earth
earth = Sphere(radius=1, checkerboard_colors=[BLUE_D, BLUE_E])
Use TODO comments to mark places that could be improved:
Example: # TODO: Add more detail to the molecular structure
Comment on camera movements or significant object movements:
Example: # This movement shows the relationship between both equations
self.play(equation1.animate.shift(LEFT2), equation2.animate.shift(RIGHT2))
NEVER reference external files that don't exist (images, SVGs, textures, etc.):
WRONG: texture = ImageMobject("assets/random_texture.jpg")
CORRECT: texture = Rectangle(fill_color=BLUE, fill_opacity=0.5)
Always use CourseScene as the class name (not GenScene or anything else).

# Critical Constraints

60-Second Duration Rule:
* Condense ALL provided content into approximately 60 seconds
* Prioritize the most important concepts
* Skip secondary details if needed
* Each voiceover should be 1-2 sentences maximum
* Use multiple short voiceovers rather than long ones

API Usage - FOLLOW EXACTLY:
* NEVER use .get_part_by_tex() with 'index' parameter - it does NOT accept this argument
* To select parts of MathTex/Tex: use indexing like equation[0], equation[1:3], etc.
* CORRECT: equation.get_part_by_tex("E") (no index parameter)
* WRONG: equation.get_part_by_tex("E", index=0)
* Use direct indexing: my_tex[0], my_tex[1], my_tex[-1]

Forbidden Features:
* DO NOT use SVGMobject or any external SVG files
* DO NOT reference external image files
* Only use built-in Manim objects and primitives

# Output Format
* ONLY return the Python code for the CourseScene class
* DO NOT include markdown code fences (no ```python)
* DO NOT include explanations or comments outside the code
* DO NOT include any text before or after the code
* The code should be ready to run directly

# Animation Structure Template
Recommended flow:
* Title screen (3-5 seconds): Introduce the topic
* Main content (45-50 seconds): Explain concepts with synchronized voiceovers
* Summary/conclusion (5-7 seconds): Recap key points

# Example structure:
## Title
with self.voiceover(text="Today we'll explore [topic]") as tracker:
            self.play(Write(title), run_time=tracker.duration)
## Main concept 1
        with self.voiceover(text="First, let's understand [concept]") as tracker:
self.play(Create(visual1), run_time=tracker.duration)
## Main concept 2
        with self.voiceover(text="Next, we see how [concept] relates") as tracker:
self.play(Transform(visual1, visual2), run_time=tracker.duration)
## Conclusion
        with self.voiceover(text="In summary, [key takeaway]") as tracker:
self.play(FadeOut(visuals), run_time=tracker.duration)

# Manim Library Reference
{manimDocs}

"""

# Fallback system prompt for non-voiceover version
SYSTEM_PROMPT_NO_VOICEOVER = """
You are an expert at creating SIMPLE, CLEAR educational Manim animations for STEM subjects WITHOUT voiceover.

CRITICAL: The class MUST be named exactly 'CourseScene' - do not use any other name!

Generate a regular Manim Scene (NOT VoiceoverScene) that uses visual animations with appropriate timing.

IMPORTANT: 
- Inherit from Scene, NOT VoiceoverScene
- Do NOT use self.voiceover() context managers
- Use self.play() with explicit run_time parameters
- Use self.wait() for pauses between animations
- Keep each concept on screen for 3-5 seconds
- THE CLASS MUST be named exactly 'CourseScene' - do not use any other name!

Example structure:
```python
class CourseScene(Scene):
    def construct(self):
        # Title slide
        title = Text("Your Topic", font_size=48)
        self.play(FadeIn(title), run_time=2)
        self.wait(2)
        self.play(FadeOut(title), run_time=1)
        
        # Concept slide
        concept = Text("Key Concept", font_size=36)
        visual = Circle(radius=1, color=BLUE)
        group = VGroup(concept, visual).arrange(DOWN)
        
        self.play(FadeIn(group), run_time=2)
        self.wait(3)
        self.play(FadeOut(group), run_time=1)
```

Use the same visual guidelines and constraints as the voiceover version, but with explicit timing.
"""


@app.function(
    image=image,
    secrets=[
        modal.Secret.from_name("elevenlabs-api-key"),
        modal.Secret.from_name("r2-credentials"),
        modal.Secret.from_name("gemini-api-key")
    ],
    timeout=900,
)
def generate_and_render_video(course_data: dict):
    import os
    import boto3
    import google.generativeai as genai
    from manim import config, Scene
    from manim_voiceover import VoiceoverScene
    from manim_voiceover.services.elevenlabs import ElevenLabsService
    
    # Set up API keys
    elevenlabs_available = False
    if "ELEVENLABS_API_KEY" in os.environ:
        os.environ["ELEVEN_API_KEY"] = os.environ["ELEVENLABS_API_KEY"]
        elevenlabs_available = True
    
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    
    # Prepare course content for Gemini
    title = course_data.get("title", "Course")
    blocks = course_data.get("blocks", [])
    subject = course_data.get("subject", "")
    
    course_content = f"Title: {title}\n"
    if subject:
        course_content += f"Subject: {subject}\n\n"
    
    for i, block in enumerate(blocks, 1):
        course_content += f"Block {i}:\n{block}\n\n"
    
    print(f"Generating Manim code for: {title}")
    
    # Try with voiceover first if ElevenLabs is available
    use_voiceover = elevenlabs_available
    attempt = 0
    max_attempts = 2
    scene = None
    warnings = []
    
    while attempt < max_attempts and scene is None:
        attempt += 1
        
        # Choose prompt based on voiceover availability
        prompt_to_use = SYSTEM_PROMPT if use_voiceover else SYSTEM_PROMPT_NO_VOICEOVER
        
        print(f"Attempt {attempt}: Generating {'with' if use_voiceover else 'without'} voiceover...")
        
        # Generate Manim code using Gemini
        model = genai.GenerativeModel('gemini-2.5-pro')
        # Format the prompt to include manimDocs
        formatted_prompt = prompt_to_use.format(manimDocs=manimDocs)
        prompt = f"{formatted_prompt}\n\nCourse Content:\n{course_content}\n\nGenerate the CourseScene class code:"
        
        response = model.generate_content(prompt, generation_config=genai.types.GenerationConfig(
            temperature=0.1,
        ))
        manim_code = response.text.strip()
        
        # Clean up the code (remove markdown if present)
        if "```python" in manim_code:
            manim_code = manim_code.split("```python")[1].split("```")[0].strip()
        elif "```" in manim_code:
            manim_code = manim_code.split("```")[1].split("```")[0].strip()
        
        print("Generated Manim code:")
        print(manim_code)
        
        # Save generated code for debugging
        with open(f"/tmp/generated_code_attempt_{attempt}.py", "w") as f:
            f.write(manim_code)
        
        # Execute the generated code to create the scene class
        exec_globals = {
            'Scene': Scene,
            'VoiceoverScene': VoiceoverScene,
            'ElevenLabsService': ElevenLabsService,
        }
        
        # Import all Manim components
        exec("from manim import *", exec_globals)
        
        try:
            exec(manim_code, exec_globals)
            
            # Find the scene class
            scene_class = exec_globals.get('CourseScene')
            if not scene_class:
                raise Exception("Generated code must define a class named 'CourseScene'")
            
            # Try to render the scene
            print("Rendering Manim scene...")
            config.media_dir = "/tmp/manim"
            config.output_file = "output"
            
            scene = scene_class()
            scene.render()
            
            print(f"✓ Successfully rendered {'with' if use_voiceover else 'without'} voiceover")
            if not use_voiceover:
                warnings.append("Video generated without voiceover due to ElevenLabs unavailability")
            
        except Exception as e:
            error_msg = str(e).lower()
            print(f"Error during attempt {attempt}: {e}")
            
            # Check if it's an ElevenLabs-related error
            if use_voiceover and ("elevenlabs" in error_msg):
                print("⚠ ElevenLabs error detected, switching to non-voiceover mode...")
                use_voiceover = False
                warnings.append("Switched to non-voiceover mode due to ElevenLabs error")
                scene = None  # Reset to retry
            else:
                # Other error, don't retry
                print(f"Generated code:\n{manim_code}")
                raise Exception(f"Failed to execute/render Manim code: {e}")
    
    if scene is None:
        raise Exception("Failed to generate video after all attempts")
    
    video_path = f"{config.media_dir}/videos/1080p60/output.mp4"
    print(f"Reading video from: {video_path}")
    
    # Upload to R2
    print("Uploading to Cloudflare R2...")
    s3_client = boto3.client(
        's3',
        endpoint_url=os.environ["R2_STORAGE_ENDPOINT"],
        aws_access_key_id=os.environ["R2_STORAGE_ACCESS_KEY"],
        aws_secret_access_key=os.environ["R2_STORAGE_SECRET_KEY"],
        region_name='auto'
    )
    
    # Generate filename from title
    safe_title = "".join(c if c.isalnum() else "_" for c in title).lower()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    r2_filename = f"videos/{safe_title}_{timestamp}.mp4"
    
    with open(video_path, "rb") as video_file:
        s3_client.upload_fileobj(
            video_file,
            os.environ["R2_STORAGE_BUCKET_NAME"],
            r2_filename,
            ExtraArgs={'ContentType': 'video/mp4'}
        )
    
    print(f"✓ Uploaded to R2: {r2_filename}")
    
    r2_url = f"{os.environ['R2_STORAGE_BASE_URL']}/{r2_filename}"
    
    result = {
        "r2_url": r2_url,
        "r2_filename": r2_filename,
        "status": "success",
        "message": "Video generated and uploaded successfully!",
        "has_voiceover": use_voiceover,
    }
    
    if warnings:
        result["warnings"] = warnings
    
    return result


@app.function(
    image=image,
    secrets=[
        modal.Secret.from_name("elevenlabs-api-key"),
        modal.Secret.from_name("r2-credentials"),
        modal.Secret.from_name("gemini-api-key"),
        modal.Secret.from_name("api-auth-key")
    ],
)
@modal.asgi_app()
def fastapi_app():
    import os 
    from fastapi import FastAPI, HTTPException, Header
    from fastapi.middleware.cors import CORSMiddleware
    from typing import Optional
    
    web_app = FastAPI(title="Manim Course Video Generator")
    
    # Enable CORS
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    def verify_api_key(x_api_key: Optional[str] = Header(None)):
        if not x_api_key:
            raise HTTPException(status_code=401, detail="API key is missing")
        
        # Get the valid API key from environment
        valid_api_key = os.environ.get("API_AUTH_KEY")
        
        if x_api_key != valid_api_key:
            raise HTTPException(status_code=403, detail="Invalid API key")
        
        return x_api_key
    
    @web_app.post("/generate")
    async def generate_course_video(data: dict, api_key: str = Header(..., alias="X-API-Key")):
        """
        Generate educational video from course content summary
        
        Expected body:
        {
            "title": "Introduction to Arrays",
            "subject": "Computer Science",
            "blocks": [
                "Block 1 content...",
                "Block 2 content...",
                ...
            ]
        }
        """
        verify_api_key(api_key)

        try:
            if "title" not in data or "blocks" not in data:
                raise HTTPException(
                    status_code=400, 
                    detail="Missing required fields: 'title' and 'blocks'"
                )
            
            result = generate_and_render_video.remote(data)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @web_app.get("/health")
    async def health(api_key: str = Header(..., alias="X-API-Key")):
        verify_api_key(api_key)
        return {"status": "healthy"}
    
    return web_app


@app.local_entrypoint()
def main():
    result = generate_and_render_video.remote({
        "title": "Introduction to Arrays",
        "subject": "Computer Science",
        "blocks": [
            "Arrays are fundamental data structures.",
            "You can perform insertion and deletion operations."
        ]
    })
    
    print(f"\n✓ {result['message']}")
    print(f"✓ R2 URL: {result['r2_url']}")
    if 'warnings' in result:
        print(f"⚠ Warnings: {', '.join(result['warnings'])}")